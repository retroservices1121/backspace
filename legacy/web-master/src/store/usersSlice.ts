// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { subscribeToStatusChanges } from 'api/userAPI';
import { OnlinePresence } from 'shared/types/documents';

const NAMESPACE = 'users';


let unsubStatuses = () => {};
export const initStatusListeners = createAsyncThunk(
  `${NAMESPACE}/initStatusListeners`,
  async (_, thunkAPI) => {
    await unsubStatuses();
    // Dispatch order requires the following eslint disable
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    unsubStatuses = await subscribeToStatusChanges((updates) => thunkAPI.dispatch(updateSome(updates)));
  },
);

type UsersState = {
  onlineStatus: Map<string, OnlinePresence>,
};

const initialState: UsersState = {
  onlineStatus: new Map<string, OnlinePresence>(),
};

const usersSlice = createSlice({
  name: NAMESPACE,
  initialState,
  reducers: {
    updateSome(state, action: PayloadAction<Map<string, OnlinePresence>>) {
      state.onlineStatus = new Map([...state.onlineStatus, ...action.payload]);
    },
  },
  extraReducers: () => {
  },
});

export default usersSlice.reducer;
export const { updateSome } = usersSlice.actions;
