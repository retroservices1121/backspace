/* eslint-disable @typescript-eslint/no-use-before-define */
// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Redux User Slice (Redux store)

import { toast } from 'react-toastify';
import { Community, MediaUse, Member, PlatformUserType, Private, UserState } from '@prisma/client';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '@src/lib/axios';

import { setPushToken } from 'api/push';
import logEvent, { EventMessages, setAnalyticsUserId } from 'lib/events';
import { MemberDocument, UserDocument, WithId } from 'types/documents';
import { User } from 'types/prisma';

import { fetchFollowedUsers } from './feedSlice';
import { RootState } from './store';
import { initStatusListeners } from './usersSlice';
const NAMESPACE = 'user';

export type OldUser = UserDocument & {
  isFetched?: boolean;
  /** This will persist locally */
  isLoggedIn?: boolean;
  /** This will persist locally */
  isWelcomed?: boolean;
  isCreator?: boolean;
  /** Public download URL of the avatar */
  avatar?: string;
  memberships?: WithId<MemberDocument>[];
  following_list?: string[],
};

// `fetchAttempted` flips true after the first /user/self call resolves
// (success OR failure). Bootstrapping logic in useAuthenticate uses it to
// distinguish "the user has no DB row yet, send them to onboarding" from
// "the fetch hasn't happened, hold off."
//
// `bootstrapping` is the broader "autoLogin pipeline is still running"
// gate. It is set true on entry to autoLogin and false in `finally`, so
// the onboarding redirect cannot fire in between the initial fetch and
// the claim-your-account attempt.
type UserSliceType = User.Self & {
  fetchAttempted: boolean;
  bootstrapping: boolean;
};
//TODO this is annoying to maintain but it's nice to have empty arrays
const initialState : UserSliceType = {
  id: undefined,
  uuid: undefined,
  authId: undefined,
  createdAt: undefined,
  username: undefined,
  bio: undefined,
  platformPermission: PlatformUserType.USER,
  name: undefined,
  verified: undefined,
  featuredCommunityId: undefined,

  state: undefined,
  private: undefined,
  banner: undefined,
  avatar: undefined,

  memberships: [],
  followers: [],
  following: [],
  conversations: [],
  notifications: [],
  communities: [],

  fetchAttempted: false,
  bootstrapping: false,
};

// const initialState : UserSliceType = {
//   authId: '',
//   avatar: undefined,
//   bio: '',
//   conversations: [],
//   createdAt: undefined,
//   featuredCommunityId: null,
//   followers: [],
//   following: [],
//   id: undefined,
//   memberships: [],
//   name: '',
//   platformPermission: PlatformUserType.USER,
//   verified: undefined,
//   username: '',
//   uuid: '',
// };

function populateStateFromObject(object: any, state: UserSliceType) {
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      state[key] = object[key];
    }
  }
  return state;
}

export const logout = createAsyncThunk(
  `${NAMESPACE}/logout`,
  // The required message is to help debug tracking down what caused a forced
  // logout. The actual wallet-provider session teardown happens in the
  // component that dispatches this — see useLogout, which calls the
  // provider's logout via useWallet() (a React hook, not a thunk-callable).
  async (message: string) => {
    console.log(message);
  },
);

//TODO this appends a membership to resolve database latency, not the best solution
export const updateMemberships = createAsyncThunk(
  `${NAMESPACE}/updateMemberships`,
  async (newMembership : WithId<MemberDocument>, thunkAPI) => {
    const { user } = thunkAPI.getState() as RootState;
    // const databaseMembers = await getWhereMember(user.id);
    // return [...databaseMembers, newMembership];
    console.error('This function does not work anymore');
  },
);

export const fetchUserBase = createAsyncThunk<User, string>(
  `${NAMESPACE}/fetchUserBase`,
  async (authId) => {
    const { data } = await axios().get(`/user?authId=${authId}`);
    return data;
  },
);

export const fetchUser = createAsyncThunk<User, string>(
  `${NAMESPACE}/fetchUser`,
  async (authId, { dispatch, getState }) => {
    const { auth } = getState() as RootState;
    //FIXME flip me back on
    // if (!user.isWelcomed) {thunkAPI.dispatch(toggleAppWelcome(true));}
    dispatch(fetchUserBase(auth.authId));
    const { data } = await axios().get('/user/self');
    return data;
  },
);

/** @private */
const login = createAsyncThunk<void, string>(
  `${NAMESPACE}/login`,
  async (authId, { dispatch }) => {
    logEvent(EventMessages.Auth.Login, { uid: authId });
    setAnalyticsUserId(authId);
    try {
      // Await the user fetch so callers (autoLogin) can read state.user
      // synchronously after this thunk resolves. Side-effect dispatches
      // can stay fire-and-forget — they don't gate the login flow.
      const userPromise = dispatch(fetchUser(authId));
      dispatch(fetchFollowedUsers(authId));
      dispatch(initStatusListeners());
      await userPromise;
    } catch (error) {
      toast.error("Something went wrong, couldn't log you in.");
      console.error(error);
      dispatch(logout('login error'));
      throw error;
    }
  },
);

/**
 * Called on app startup once Privy resolves an authenticated session.
 *
 * Three states need to be untangled here:
 *   1. Returning user — User row keyed by Privy DID exists in Postgres.
 *      `login()` populates state.user; nothing else to do.
 *   2. Returning legacy user — row exists keyed by their old Firebase
 *      UID, with `Private.email` matching the email Privy verified.
 *      The first /user/self returns null. We POST /api/auth/claim, which
 *      atomically rewrites User.authId to the Privy DID. We then re-fetch.
 *   3. Brand-new user — no row anywhere. Claim returns no_match, the
 *      user lands on /auth/onboarding (useAuthenticate redirect once
 *      `bootstrapping` flips false), and useOnboarding creates the row.
 *
 * `bootstrapping` is held true for the whole pipeline so the onboarding
 * redirect cannot fire between the initial fetch and the claim attempt.
 */
export const autoLogin = createAsyncThunk(
  `${NAMESPACE}/autologin`,
  async (authId: string, thunkAPI) => {
    thunkAPI.dispatch(setBootstrapping(true));
    try {
      await thunkAPI.dispatch(login(authId));
      setPushToken(authId);

      const afterLogin = thunkAPI.getState() as RootState;
      if (afterLogin.user.id) return; // case 1 — done.

      // Cases 2 / 3: no row found by Privy DID. Try to claim a legacy row.
      try {
        const { data } = await axios().post('/auth/claim');
        if (data?.claimed) {
          await thunkAPI.dispatch(fetchUser(authId));
        }
      } catch (err) {
        // Network or server error — log and let the user fall through to
        // onboarding. A future autoLogin (next page load) will retry.
        console.warn('Claim attempt failed', err);
      }
    } finally {
      thunkAPI.dispatch(setBootstrapping(false));
    }
  },
);

export const refreshMemberships = createAsyncThunk(
  `${NAMESPACE}/refreshMemberships`,
  async (_, { dispatch, getState }) => {
    const { user } = getState() as RootState;
    dispatch(fetchUser(user.authId));
  },
);

export const userSlice = createSlice({
  name: NAMESPACE,
  initialState: initialState,
  reducers: {
    setOnboarded(state) {
      state.state.onboarded = true;
    },
    updateUserFields(state, { payload }) {
      return populateStateFromObject(payload, state);
    },
    /** @deprecated */
    addConversation(state, { payload }) {
      state.conversations = [payload, ...state.conversations];
    },
    setBootstrapping(state, { payload }) {
      state.bootstrapping = payload;
    },
  },
  extraReducers: builder => {
    builder.addCase(logout.fulfilled, () => {
      return initialState;
    });
    builder.addCase(fetchUserBase.fulfilled, (state, { payload: user }) => {
      console.log(
        user?.username
          ? `Logged in as ${JSON.stringify(user.username)}`
          : 'Logged In', { toastId: 'fetchUser success' });
      state.fetchAttempted = true;
      return populateStateFromObject(user, state);
    });
    builder.addCase(fetchUserBase.rejected, (state) => {
      state.fetchAttempted = true;
    });
    builder.addCase(fetchUser.fulfilled, (state, { payload: user }) => {
      state.fetchAttempted = true;
      return populateStateFromObject(user, state);
    });
    builder.addCase(fetchUser.rejected, (state) => {
      state.fetchAttempted = true;
    });
    builder.addCase(login.fulfilled, (state, { payload: user }) => {
      return populateStateFromObject(user, state);
    });
  },
});

// Action creators are generated for each case reducer function
export const { updateUserFields, setOnboarded, setBootstrapping } = userSlice.actions;

export default userSlice.reducer;
