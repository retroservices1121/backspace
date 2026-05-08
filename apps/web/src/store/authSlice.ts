// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { createSlice } from '@reduxjs/toolkit';
import { User } from 'firebase/auth'; 
const NAMESPACE = 'auth';

export enum AuthStatus {
  Unknown,
  SignedIn,
  SignedOut,
}

type AuthState = {
  user: User,
  authId: string
  email: string
  status: AuthStatus
};

const initialState: AuthState = {
  user: null,
  authId: null,
  email: null,
  status: AuthStatus.Unknown,
};


const authSlice = createSlice({
  name: NAMESPACE,
  initialState,
  reducers: {
    setUser: (state, { payload }) => {state.user = payload;},
    setAuthId: (state, { payload }) => {state.authId = payload;},
    setEmail: (state, { payload }) => {state.email = payload;},
    setStatus: (state, { payload }) => {state.status = payload;},
    clearAuthSlice: (state) => {return { ...initialState, status: state.status };}, //exclude auth status from the update
  },
  extraReducers: {

  },
});

export default authSlice.reducer;
export const {
  setUser, 
  setAuthId,
  setEmail,
  setStatus, 
  clearAuthSlice,
} = authSlice.actions;