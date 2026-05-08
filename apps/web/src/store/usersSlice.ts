// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Author(s): See Git History
//
// Online status / friend presence. Migrated off the Firebase Realtime
// Database `subscribeToStatusChanges` listener onto Ably presence
// (lib/presence.ts) on 2026-05-08.
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { subscribePresence } from '@src/lib/presence';
import { OnlinePresence } from 'types/documents';
import { User } from 'types/prisma';

import { RootState } from './store';

const NAMESPACE = 'users';

let unsubStatuses: () => void = () => {};

/**
 * Subscribe to global presence updates and project them into
 * `state.users.onlineStatus`. The thunk reads the current user's authId
 * (set by useAuthenticate after Privy resolves) so the Ably connection
 * shares the per-DID client that announcePresence already opened.
 */
export const initStatusListeners = createAsyncThunk(
  `${NAMESPACE}/initStatusListeners`,
  async (_, thunkAPI) => {
    unsubStatuses();
    const state = thunkAPI.getState() as RootState;
    const did = state.auth.authId;
    if (!did) {
      // Not signed in — nothing to subscribe to. Future autoLogin will
      // re-dispatch this thunk once authId is set.
      unsubStatuses = () => {};
      return;
    }
    unsubStatuses = await subscribePresence(did, (members) =>
      thunkAPI.dispatch(setOnlineStatus(members)),
    );
  },
);

type UsersState = {
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
    // Replace the presence map wholesale — Ably gives us the full member
    // list on every update so partial merging is unnecessary.
    setOnlineStatus(state, { payload }: PayloadAction<Map<string, OnlinePresence>>) {
      state.onlineStatus = payload;
    },
  },
  extraReducers: () => {},
});

export default usersSlice.reducer;
export const { upsertUsers, setOnlineStatus } = usersSlice.actions;

export const usersActions = {
  ...usersSlice.actions,
};
