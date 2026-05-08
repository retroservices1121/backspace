import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';

import { setConnected } from 'api/presence';
import ProtectedRoute, { ConditionRedirectPair } from 'components/ProtectedRoute';
import useInitApp from 'hooks/useInitApp';
import Admin from 'pages/admin';
import Auth from 'pages/auth';
import Community from 'pages/Community';
import Dev from 'pages/Dev';
import DirectMessage from 'pages/DirectMessage';
import Feed from 'pages/Feed';
import Profile from 'pages/Profile';
import Settings from 'pages/Settings';
import { RootState } from 'store/store';
import { autoLogin, logout } from 'store/userSlice';
import { auth } from 'util/firebase';

import Passcode from './Passcode';

const authRoute = '/auth';
const baseRoute = '/app';

export const APP = {
  INDEX: '/',
  AUTH: {
    INDEX: authRoute,
    REGISTER: `${authRoute}/register`,
    ONBOARDING: `${authRoute}/onboarding`,
    LOGIN: `${authRoute}/login`,
    FORGOT: `${authRoute}/forgot`,
    LOGOUT: `${authRoute}/logout`,
  },
  PASSCODE: {
    INDEX: `/${baseRoute}/passcode`,
  },
  PROFILE: {
    INDEX: '/:user',
    USERNAME: (
      username: string,
    ) => `/${username}`,
  },
  DISCOVER: {
    INDEX: `${baseRoute}/discover`,
  },
  MESSAGES: {
    INDEX: `${baseRoute}/messages`,
  },
  COMMUNITY: {
    INDEX: `${baseRoute}/community`,
  },
  SETTINGS: {
    INDEX: `${baseRoute}/settings`,
  },
  ERRORS: {
    DEFAULT: `${baseRoute}/error`,
  },
  DEV: {
    INDEX: '/dev',
    STYLE_GUIDE: '/dev/styles',
  },
  ADMIN: {
    INDEX: `${baseRoute}/admin`,
  },
};

const Routes:React.FC<any> = () => {
  useInitApp();
  const dispatch = useDispatch();
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { isLoggedIn, access_code, onboarded, id: uid } = useSelector((state: RootState) => state.user);
  // const requirePasscode = process.env.REACT_APP_PASSCODE_REQUIRED == '1';
  const [standardCondition, setStandardCondition] = useState<Array<ConditionRedirectPair>>([]);
  useEffect(() => {
    // onAuthStateChanged returns the unsubscribe method, returning that will unsub when unrendering auth
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setConnected(firebaseUser.uid);
        dispatch(autoLogin(firebaseUser.uid));
      } else {
        dispatch(logout('onAuthStateChanged error'));
      }
    });
  }, []);

  useEffect(() => {
    setStandardCondition(
      [
        { pass: isLoggedIn ? true : false, redirect: Auth },
        { pass: onboarded ? true : false, redirect: Auth },
        //  If below line is added back in. You must also update NavigationBar boolean
        // { pass: !(requirePasscode && !access_code?.validated), redirect: Passcode },
      ],
    );
    
  }, [isLoggedIn, uid, onboarded, access_code?.validated]);

  return (
    <>
    <Switch>
      <Route path={APP.AUTH.INDEX} component={Auth} />
      <Route path={APP.DEV.INDEX} component={Dev} />
      <Route path={APP.PASSCODE.INDEX} component={Passcode} />
      {/* Authenticated Routes */}
      <ProtectedRoute exact path={APP.MESSAGES.INDEX} component={DirectMessage} condition={standardCondition}/>
      <ProtectedRoute exact path={APP.COMMUNITY.INDEX} component={Community} condition={standardCondition} />
      <ProtectedRoute exact path={APP.SETTINGS.INDEX} component={Settings} condition={standardCondition} />
      <ProtectedRoute exact path={APP.ADMIN.INDEX} component={Admin} condition={standardCondition}/>
      {/* We'll assume that any URL that doesn't match, is intended to be a user's name */}
      <Route exact strict path={APP.PROFILE.INDEX} component={Profile} />
      <ProtectedRoute path="/" component={Feed} condition={standardCondition} />
    </Switch>
    </>
  );
};

export default Routes;
