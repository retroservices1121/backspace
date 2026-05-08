/* eslint-disable @typescript-eslint/no-use-before-define */
// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Redux User Slice (Redux store)

import { toast } from 'react-toastify';
import { Community, MediaUse, Member, PlatformUserType, Private, UserState } from '@prisma/client';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from '@src/lib/axios';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
} from 'firebase/auth';

import { logoutUser } from 'api/auth';
import { registerUser as createUserAPI } from 'api/auth';
import { setPushToken } from 'api/push';
import go from 'lib/async';
import logEvent, { EventMessages, setAnalyticsUserId } from 'lib/events';
import { toggleAuthLoader } from 'store/loadSlice';
import { LoginFormState, OnboardingFields, OnboardingFormState, RegisterFormState } from 'types/auth';
import { MemberDocument, UserDocument, WithId } from 'types/documents';
import { User } from 'types/prisma';
//import { useRouter } from 'next/router';
import { auth as fbAuth } from 'utils/firebase';

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

type UserSliceType = User.Self;
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
  // The required message is to help debug tracking down what caused a forced logout
  async (message: string) => {
    console.log(message);
    await logoutUser();
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
  async (authId, { getState }) => {
    const { auth } = getState() as RootState;
    const { data } = await axios(auth.user?.getIdToken()).get(`/user?authId=${authId}`);
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
      dispatch(fetchUser(authId)).then( () => {
        // dispatch(subscribeRecentNotifications());
        dispatch(fetchFollowedUsers(authId));
        dispatch(initStatusListeners());
      });
      // const user = await dispatch(fetchUser(authId)).unwrap();
      // if (!user.interests) {
      //   dispatch(toggleDiscoverModal(true));
      // }
      // await dispatch(initStatusListeners());
      // return {
      //   ...user,
      //   // In case the user from fetchUser isn't "ready", we need to maintain the userId in redux.
      //   id: authId,
      // };

    } catch (error) {
      toast.error("Something went wrong, couldn't log you in.");
      console.error(error);
      // If "localStorage login" failed, to avoid a auth de-sync, lets log them out of firebase.
      dispatch(logout('login error'));
      throw error;
    }
  },
);

/** Called by the login form */
export const formLogin = createAsyncThunk<void, LoginFormState>(
  `${NAMESPACE}/loginForm`,
  async ({ email, password, rememberMe }, { dispatch }) => {
    if (rememberMe) {
      setPersistence(fbAuth, browserLocalPersistence);
    } else {
      setPersistence(fbAuth, browserSessionPersistence);
    }

    dispatch(toggleAuthLoader(true));
    const response = await go(signInWithEmailAndPassword(fbAuth, email, password));
    dispatch(toggleAuthLoader(false));
    if (response.type === 'error') {
      toast.error('Please check your email and password.');
      // Idk which of these 2 is better
      // return thunkAPI.rejectWithValue(response.error);
      throw response.error;
    }

    await dispatch(login(response.data.user.uid));
  },
);

/** Called on app startup by onAuthStateChanged */
export const autoLogin = createAsyncThunk(
  `${NAMESPACE}/autologin`,
  async (authId: string, thunkAPI) => {
    await thunkAPI.dispatch(login(authId));
    setPushToken(authId);
  },
);

export const createUser = createAsyncThunk(
  `${NAMESPACE}/createUser`,
  async (formState : RegisterFormState, thunkAPI) => {
    thunkAPI.dispatch(toggleAuthLoader(true));
    const { user } = await createUserAPI(formState);
    thunkAPI.dispatch(toggleAuthLoader(false));
    return user.uid;
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
      return populateStateFromObject(user, state);
    });
    builder.addCase(fetchUser.fulfilled, (state, { payload: user }) => {
      return populateStateFromObject(user, state);
    });
    builder.addCase(login.fulfilled, (state, { payload: user }) => {
      return populateStateFromObject(user, state);
    });
  },
});

// Action creators are generated for each case reducer function
export const { updateUserFields, setOnboarded } = userSlice.actions;

export default userSlice.reducer;
