// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Author(s): See Git History
//
// Migrated from Firebase Auth's onAuthStateChanged to Privy's usePrivy
// (2026-05-08). Same redux-side surface — sets authId/email/status — so
// downstream code that reads from authSlice does not need to change.
//
// `authId` is now the Privy DID (`did:privy:...`) instead of the Firebase UID.
// The User row's authId column was renamed in semantics, not in shape.

import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { setConnected } from '@src/api/presence';
import { removeAuthCookie, setAuthCookie } from '@src/lib/cookies';
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

  const { ready, authenticated, user, getAccessToken } = usePrivy();

  // Handle redux + cookie sync as Privy state evolves
  useEffect(() => {
    if (!ready) {
      dispatch(setStatus(AuthStatus.Unknown));
      return;
    }
    if (authenticated && user) {
      const did = user.id; // `did:privy:...`
      const email = user.email?.address ?? user.google?.email ?? null;
      dispatch(setStatus(AuthStatus.SignedIn));
      dispatch(setAuthId(did));
      if (email) dispatch(setEmail(email));
      dispatch(autoLogin(did));
      setConnected(did);
      // Privy's getAccessToken returns a JWT verified by @backspace/auth
      // server-side. Store it as a cookie so SSR / middleware can read it.
      getAccessToken().then((token) => {
        if (token) setAuthCookie(token);
      });
    } else {
      dispatch(setStatus(AuthStatus.SignedOut));
      removeAuthCookie();
      dispatch(clearAuthSlice());
      dispatch(logout('privy unauthenticated'));
    }
  }, [ready, authenticated, user]);

  // Routing on auth state changes (unchanged from the Firebase version)
  useEffect(() => {
    if (authState === AuthStatus.SignedOut) {
      router.push(APP.AUTH.LOGIN);
    } else if (authState === AuthStatus.SignedIn) {
      if (userState?.onboarded === false) {
        if (router.pathname.includes('logout')) {
          console.log('User manually logging out, skipping redirect to onboarding');
        } else {
          router.push(APP.AUTH.ONBOARDING);
        }
      }
    }
  }, [authState, userState?.onboarded]);

  return authState;
}
