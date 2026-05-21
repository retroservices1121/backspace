// Auth slice. Migrated off the Firebase `User` shape (2026-05-08); the slice
// only tracks the wallet-provider user id (Privy DID today, CDP user id post-
// migration), the email lifted off the provider's claims, and the current
// sign-in status. Components that need richer wallet data should call
// useWallet() directly — see @src/lib/wallet.
import { createSlice } from '@reduxjs/toolkit';

const NAMESPACE = 'auth';

export enum AuthStatus {
  Unknown,
  SignedIn,
  SignedOut,
}

type AuthState = {
  authId: string;
  email: string;
  status: AuthStatus;
};

const initialState: AuthState = {
  authId: null,
  email: null,
  status: AuthStatus.Unknown,
};

const authSlice = createSlice({
  name: NAMESPACE,
  initialState,
  reducers: {
    setAuthId: (state, { payload }) => { state.authId = payload; },
    setEmail: (state, { payload }) => { state.email = payload; },
    setStatus: (state, { payload }) => { state.status = payload; },
    // exclude auth status from the reset
    clearAuthSlice: (state) => ({ ...initialState, status: state.status }),
  },
  extraReducers: {},
});

export default authSlice.reducer;
export const {
  setAuthId,
  setEmail,
  setStatus,
  clearAuthSlice,
} = authSlice.actions;
