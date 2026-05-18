import React from 'react';

import Feed from 'components/Feed/Feed';
//import ProtectedRoute, { ConditionRedirectPair } from 'components/ProtectedRoute';
import useInitApp from 'hooks/useInitApp';

//import Passcode from './Passcode';

const authRoute = '/auth';
const settingsRoute = '/settings';
const baseRoute = '';

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
  // Catalog of tradeable markets. URL is /markets to match the LeftNav
  // label; the namespace name follows.
  MARKETS: {
    INDEX: `${baseRoute}/markets`,
  },
  // Back-compat alias — kept so any out-of-tree callers / saved links
  // still resolve to the same route. New code should use APP.MARKETS.
  DISCOVER: {
    INDEX: `${baseRoute}/markets`,
  },
  MESSAGES: {
    INDEX: `${baseRoute}/messages`,
  },
  COMMUNITY: {
    INDEX: `${baseRoute}/community`,
  },
  PORTFOLIO: {
    INDEX: `${baseRoute}/portfolio`,
  },
  BOOKMARKS: {
    INDEX: `${baseRoute}/bookmarks`,
  },
  SETTINGS: {
    INDEX: settingsRoute,
    ACCOUNT: `${settingsRoute}/account`,
    NOTIFICATION: `${settingsRoute}/notifications`,
    SECURITY: `${settingsRoute}/security`,
    APPEARANCE: `${settingsRoute}/appearance`,
    BILLING: `${settingsRoute}/billing`,
    CREATOR: `${settingsRoute}/creator`,
  },
  ERRORS: {
    DEFAULT: `${baseRoute}/error`,
  },
  DEV: {
    INDEX: '/dev',
    STYLE_GUIDE: '/dev/styles',
  },
};

const Routes:React.FC<any> = () => {
  useInitApp();
  return (
    <>
      {/*
      <ProtectedRoute exact path={APP.MESSAGES.INDEX} component={DirectMessage} condition={standardCondition}/>
      <ProtectedRoute exact path={APP.COMMUNITY.INDEX} component={Community} condition={standardCondition} />
      <ProtectedRoute exact path={APP.SETTINGS.INDEX} component={Settings} condition={standardCondition} />
      */}
      <Feed/>
    </>
  );
};

export default Routes;
