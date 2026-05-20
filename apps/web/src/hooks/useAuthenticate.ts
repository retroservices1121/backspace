// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Author(s): See Git History
//
// Migrated from Firebase Auth's onAuthStateChanged to Privy's usePrivy
// (2026-05-08), then re-abstracted to useWallet() (2026-05-20) so the
// hook doesn't care which auth provider is mounted. Same redux-side
// surface — sets authId/email/status — so downstream code that reads
// from authSlice does not need to change.
//
// `authId` is the provider's stable user id (Privy DID 'did:privy:...'
// today, CDP user id post-migration). The User row's authId column
// was renamed in semantics across the Firebase → Privy switch; the
// CDP swap keeps the same shape.

import { useEffect } from 'react';
import { useWallet } from '@src/lib/wallet';
import { removeAuthCookie, setAuthCookie } from '@src/lib/cookies';
import { announcePresence, disconnectPresence } from '@src/lib/presence';
import { APP } from '@src/pages';
import { AuthStatus, clearAuthSlice, setAuthId, setEmail, setStatus } from '@src/store/authSlice';
import { RootState, useAppDispatch, useAppSelector } from '@src/store/store';
import { autoLogin, logout } from '@src/store/userSlice';
import { useRouter } from 'next/router';

export default function useAuthentication() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const authState = useAppSelector((state: RootState) => state.auth.status);
  const userState = useAppSelector((state: RootState) => state.user.state);
  const fetchAttempted = useAppSelector((state: RootState) => state.user.fetchAttempted);
  const bootstrapping = useAppSelector((state: RootState) => state.user.bootstrapping);

  const { ready, authenticated, user, getAccessToken } = useWallet();

  // Handle redux + cookie sync as wallet-provider state evolves
  useEffect(() => {
    if (!ready) {
      dispatch(setStatus(AuthStatus.Unknown));
      return;
    }
    if (authenticated && user) {
      const did = user.id; // provider-stable user id
      const email = user.email ?? null;
      dispatch(setStatus(AuthStatus.SignedIn));
      dispatch(setAuthId(did));
      if (email) dispatch(setEmail(email));
      void announcePresence(did);
      // The access-token cookie MUST be written before autoLogin runs.
      // lib/axios reads the cookie synchronously when it builds a
      // request, so firing autoLogin first sends the initial
      // /user/self call out unauthenticated — it 401s, the app sees
      // "no user", and bounces a fully-onboarded user back to
      // onboarding. Sequence it: token -> cookie -> autoLogin.
      getAccessToken()
        .then((token) => {
          if (token) setAuthCookie(token);
        })
        .catch((err) => {
          console.error('getAccessToken failed during auth sync', err);
        })
        .finally(() => {
          dispatch(autoLogin(did));
        });
    } else {
      dispatch(setStatus(AuthStatus.SignedOut));
      removeAuthCookie();
      dispatch(clearAuthSlice());
      dispatch(logout('privy unauthenticated'));
      disconnectPresence();
    }
  }, [ready, authenticated, user]);

  // Routing on auth state changes. Sends users without a finished
  // onboarding row to /auth/onboarding — covers two cases:
  //   1. User has a User row but UserState.onboarded is false (legacy).
  //   2. Brand-new Privy login with no User row at all (first-time signup).
  // Gate on fetchAttempted so we do not flicker-redirect during the
  // initial /user/self request.
  useEffect(() => {
    if (authState === AuthStatus.SignedOut) {
      router.push(APP.AUTH.LOGIN);
      return;
    }
    if (authState !== AuthStatus.SignedIn) return;
    if (!fetchAttempted || bootstrapping) return;
    if (userState?.onboarded === true) return;
    if (router.pathname.includes('logout')) {
      console.log('User manually logging out, skipping redirect to onboarding');
      return;
    }
    if (router.pathname === APP.AUTH.ONBOARDING) return;
    router.push(APP.AUTH.ONBOARDING);
  }, [authState, userState?.onboarded, fetchAttempted, bootstrapping]);

  return authState;
}
