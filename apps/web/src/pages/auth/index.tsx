// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Authentication Components

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import useAuthentication from '@src/hooks/useAuthenticate';
import { AuthStatus } from '@src/store/authSlice';
import { useRouter } from 'next/router';

import { logEventScreen, Screens } from 'lib/events';
import { APP } from 'pages';
import { RootState } from 'store/store';
/*
import TemporaryLogout from './components/TemporaryLogout';
import ForgotPassword from './ForgotPassword';
import Login from './Login';
import Onboarding from './Onboarding';
import Register from './Register';
*/


// Note: Auth listener is at the top level (App.js)
const Auth: React.FC = () => {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.user);
  const authState = useAuthentication();
  logEventScreen(Screens.Auth);

  /*
  useEffect(() => {
    if (!user.isLoggedIn) history.navigate(APP.AUTH.REGISTER);
  }, []);
  */

  //NOTE: All redirects should be in this useEffect
  useEffect(() => {
    if (authState === AuthStatus.SignedOut) {
      router.push(APP.AUTH.REGISTER);
      return;
    }
    if (authState === AuthStatus.SignedIn && !user.state.onboarded) {
      router.push(APP.AUTH.ONBOARDING);
      return;
    }
    if (authState === AuthStatus.SignedIn && user.state.onboarded) {
      router.push(APP.AUTH.LOGOUT);
      return;
    }
  }, []);

  //NOTE: This page is basically acting as a routing point now so idk what should go here.

  //FIXME: This should be figured out.
  return (
    <div className="flex w-full h-full">What are you doing here?</div>
  );
};

export default Auth;
