// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Unsubscribe } from 'firebase/firestore';

import { subscribeToStatusChanges } from 'api/userAPI';
import { OnlinePresence } from 'types/documents';
import { User } from 'types/prisma';

const NAMESPACE = 'users';


let unsubStatuses: Unsubscribe = async () => {};

export const initStatusListeners = createAsyncThunk(
  `${NAMESPACE}/initStatusListeners`,
  async (_, thunkAPI) => {
    unsubStatuses();
    // Dispatch order requires the following eslint disable
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    unsubStatuses = await subscribeToStatusChanges((updates) => thunkAPI.dispatch(updateSome(updates)));
  },
);

type UsersState = {
  // TODO lets use a Record<string, OnlinePresence> instead. -Sam
  onlineStatus: Map<string, OnlinePresence>,
  users: Record<string, User>
};

const initialState: UsersState = {
  onlineStatus: new Map<string, OnlinePresence>(),
  users: {},
};

const usersSlice = createSlice({
  name: NAMESPACE,
  initialState,
  reducers: {
    upsertUsers(state, { payload }: PayloadAction<User[]>) {
      for (const user of payload) {
        state.users[user.uuid] = {
          ...state.users[user.uuid],
          ...user,
        };
      }
    },
    updateSome(state, action: PayloadAction<Map<string, OnlinePresence>>) {
      const newThingy = state.onlineStatus?.forEach((value, key) => action.payload.set(key, value));
      //@ts-ignore FIXME: BRENTON
      state.onlineStatus = newThingy;
      //state.onlineStatus = new Map([...state.onlineStatus, ...action.payload]);
    },
  },
  extraReducers: () => {
  },
});

export default usersSlice.reducer;
export const { updateSome } = usersSlice.actions;

export const usersActions = {
  ...usersSlice.actions,
};