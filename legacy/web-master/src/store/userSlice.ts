/* eslint-disable @typescript-eslint/no-use-before-define */
// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Redux User Slice (Redux store)

import { toast } from 'react-toastify';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { push } from 'connected-react-router';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
} from 'firebase/auth';

import { isUsernameAvailable, logoutUser } from 'api/auth';
import { createUser as createUserAPI, submitOnboarding as submitOnboardingAPI } from 'api/auth';
import { setPushToken } from 'api/push';
import { getUser, getUserPrivateById, getWhereMember } from 'api/userAPI';
import go from 'lib/async';
import logEvent, { EventMessages, setAnalyticsUserId } from 'lib/events';
import { APP } from 'pages';
import { MemberDocument, UserDocument, WithId } from 'shared/types/documents';
import { toggleAuthLoader } from 'store/loadSlice';
import { RootState } from 'store/store';
import { LoginFormState, OnboardingFormState, RegisterFormState } from 'types/auth';
import { auth } from 'util/firebase';

import { toggleAppWelcome } from './appSlice';
import { fetchFollowedUsers, toggleDiscoverModal } from './feedSlice';
import { initFetchBlocked } from './networkSlice';
import { subscribeRecentNotifications } from './notificationsSlice';
import { initStatusListeners } from './usersSlice';

const NAMESPACE = 'user';

export type User = UserDocument & {
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

const initialState = {
  isFetched: false,
  isLoggedIn: false,
  isWelcomed: false,
  isCreator: false,
  memberships: undefined,
  following_list: undefined,
  //TODO remove this unknown if possible, not sure why this is broken now
} as unknown as User;

export const logout = createAsyncThunk(
  `${NAMESPACE}/logout`,
  // The required message is to help debug tracking down what caused a forced logout
  // eslint-disable-next-line
  async (message: string) => {
    await logoutUser();
  },
);

//TODO this appends a membership to resolve database latency, not the best solution
export const updateMemberships = createAsyncThunk(
  `${NAMESPACE}/updateMemberships`,
  async (newMembership : WithId<MemberDocument>, thunkAPI) => {
    const { user } = thunkAPI.getState() as RootState;
    const databaseMembers = await getWhereMember(user.id);
    return [...databaseMembers, newMembership];
  },
);

/** @private */
const fetchUser = createAsyncThunk<User, string>(
  `${NAMESPACE}/fetchUser`,
  async (userId, thunkAPI) => {
    const { user } = thunkAPI.getState() as RootState;
    if (!user.isWelcomed) {thunkAPI.dispatch(toggleAppWelcome(true));}
    thunkAPI.dispatch(subscribeRecentNotifications());
    thunkAPI.dispatch(fetchFollowedUsers(user.id));
    thunkAPI.dispatch(initFetchBlocked());
    const privateUser = await getUserPrivateById(userId);
    const partialUser = await getUser(userId);
    return {
      ...partialUser,
      isLoggedIn: true,
      isFetched: true,
      isWelcomed: user.isWelcomed,
      isCreator: typeof privateUser?.account_link == 'object',
      id: userId,
    };
  },
);

/** @private */
const login = createAsyncThunk<User, string>(
  `${NAMESPACE}/login`,
  async (userId, { dispatch }) => {
    logEvent(EventMessages.Auth.Login, { uid: userId });
    setAnalyticsUserId(userId);
    try {
      const user = await dispatch(fetchUser(userId)).unwrap();
      if (!user.interests) {
        dispatch(toggleDiscoverModal(true));
      }
      await dispatch(initStatusListeners());
      return {
        ...user,
        // In case the user from fetchUser isn't "ready", we need to maintain the userId in redux.
        id: userId,
      };

    } catch (error) {
      toast.error("Something went wrong, couldn't log you in.");
      // If "localStorage login" failed, to avoid a auth de-sync, lets log them out of firebase.
      dispatch(logout('login error'));
      dispatch(push(APP.AUTH.LOGIN));
      throw error;
    }
  },
);

/** Called by the login form */
export const formLogin = createAsyncThunk<void, LoginFormState>(
  `${NAMESPACE}/loginForm`,
  async ({ email, password, rememberMe }, { dispatch }) => {
    if (rememberMe) {
      setPersistence(auth, browserLocalPersistence);
    } else {
      setPersistence(auth, browserSessionPersistence);
    }

    dispatch(toggleAuthLoader(true));
    const response = await go(signInWithEmailAndPassword(auth, email, password));
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
  async (userId: string, thunkAPI) => {
    await thunkAPI.dispatch(login(userId));
    setPushToken(userId);
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

export const submitOnboarding = createAsyncThunk<void, OnboardingFormState>(
  `${NAMESPACE}/submitOnboarding`,
  async (formState, helpers) => {
    const { user } = helpers.getState() as RootState;

    if (!user?.id) {
      //FIXME See [#77](https://linear.app/newsocial/issue/BC-77)
      toast.warn('Error, missing User ID, please refresh the page');
      return;
    }

    const available = await isUsernameAvailable(user.id, formState.username);

    if (!available) {
      toast.error('Username is taken. Please select another.');
      return;
    }

    // TODO make this a thunk
    await submitOnboardingAPI(user.id, formState);
    helpers.dispatch(setOnboarded());
    helpers.dispatch(push(APP.INDEX));
    helpers.dispatch(fetchUser(user.id));
  },
);

export const refreshMemberships = createAsyncThunk(
  `${NAMESPACE}/refreshMemberships`,
  async (_, thunkAPI) => {
    const { user } = thunkAPI.getState() as RootState;
    const memberships = await getWhereMember(user.id);
    return memberships;
  },
);

export const userSlice = createSlice({
  name: NAMESPACE,
  initialState: initialState,
  reducers: {
    setWelcomed(state) {
      state.isWelcomed = true;
    },
    setOnboarded(state) {
      state.onboarded = true;
    },
    setAccessCodeValid(state) {
      state.access_code = { 
        value: state.access_code?.value || '', 
        validated: true, 
      };
    },
  },
  extraReducers: builder => {
    builder.addCase(logout.fulfilled, () => {
      return initialState;
    });
    builder.addCase(updateMemberships.fulfilled, (state, action) => {
      state.memberships = action.payload;
    });
    builder.addCase(fetchUser.fulfilled, (state, { payload: user }) => {
      console.info(user.username ? `Logged in as ${JSON.stringify(user.username)}` : 'Logged In');
      // toast.success(user.username ? `Logged in as ${JSON.stringify(user.username)}` : 'Logged In', { toastId: 'fetchUser success' });
      return user;
    });
    builder.addCase(createUser.fulfilled, (state, action) => {
      state.id = action.payload;
    });
    builder.addCase(refreshMemberships.fulfilled, (state, { payload }) => {
      state.memberships = payload;
    });
  },
});

// Action creators are generated for each case reducer function
export const { setWelcomed, setOnboarded, setAccessCodeValid } = userSlice.actions;

export default userSlice.reducer;

export const selectUid = (state: RootState) => state.user.id;
export const selectFollowedCommunities = (state: RootState) => state.user.memberships;
