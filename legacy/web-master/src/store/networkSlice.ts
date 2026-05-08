// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { toast } from 'react-toastify';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { blockUser as apiBlockUser, getAllBlocked } from 'api/userAPI';

import { RootState } from './store';

const NAMESPACE = 'network';

export const blockUser = createAsyncThunk(
  `${NAMESPACE}/blockUser`,
  async (blockUpdate: { userId: string, value: boolean }, { getState }) => {
    const { user } = getState() as RootState;
    const mapUpdate = new Map<string, boolean>();
    mapUpdate.set(blockUpdate.userId, blockUpdate.value);
    apiBlockUser(user.id, blockUpdate.userId, blockUpdate.value);
    return mapUpdate;
  },
);

export const initFetchBlocked = createAsyncThunk(
  `${NAMESPACE}/initFetchBlocked`,
  async (_, { getState }) => {
    const { user } = getState() as RootState;
    const blockedMap = await getAllBlocked(user.id);
    return blockedMap;
  },
);

//Blocked state is updated whenever a user's data is fetched
type UsersState = {
  blockedUsers: Map<string, boolean>, //If I blocked them, move to true
  blockedByUsers: Map<string, boolean>, //If they blocked me, move to true
};

const initialState: UsersState = {
  blockedUsers: new Map<string, boolean>(),
  blockedByUsers: new Map<string, boolean>(),
};

const networkSlice = createSlice({
  name: NAMESPACE,
  initialState,
  reducers: {
    updateBlockedStatus(state, action: PayloadAction<Map<string, boolean>>) {
      state.blockedUsers = new Map([...state.blockedUsers, ...action.payload]);
    },
    updateBlockedByStatus(state, action: PayloadAction<Map<string, boolean>>) {
      state.blockedByUsers = new Map([...state.blockedByUsers, ...action.payload]);
    },
  },
  extraReducers: builder => {
    builder.addCase(blockUser.fulfilled, (state, action) => {
      state.blockedUsers = new Map([...state.blockedUsers, ...action.payload]);
      toast.info('Updated block list');
    });
    builder.addCase(initFetchBlocked.fulfilled, (state, action) => {
      state.blockedUsers = action.payload;
    });
  },
});

export default networkSlice.reducer;
export const { updateBlockedStatus, updateBlockedByStatus } = networkSlice.actions;
