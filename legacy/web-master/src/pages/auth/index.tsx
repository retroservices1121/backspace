// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Authentication Components

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from 'styled-components';

import { ReactComponent as AppDescription } from 'graphics/app-description.svg';
import useRouting from 'hooks/useRouting';
import { logEventScreen, Screens } from 'lib/events';
import { Redirect, Route } from 'lib/routing';
import { APP } from 'pages';
import { RootState } from 'store/store';

import '@lottiefiles/lottie-player';

import { AuthAside, AuthMain, Container } from './components/styles';
import TemporaryLogout from './components/TemporaryLogout';
import ForgotPassword from './ForgotPassword';
import Login from './Login';
import Onboarding from './Onboarding';
import Register from './Register';


// Note: Auth listener is at the top level (App.js)
const Auth: React.FC = () => {
  const history = useRouting();
  const user = useSelector((state: RootState) => state.user);
  const theme = useTheme();
  logEventScreen(Screens.Auth);

  useEffect(() => {
    if (!user.isLoggedIn) history.navigate(APP.AUTH.REGISTER);
  }, []);

  return (
    <Container>
      <AuthMain>
        {/* <Logo $banner onClick={() => history.navigate(APP)}/> */}
        <br />
        <Route path={APP.AUTH.REGISTER} component={Register} />
        {user.id && !user.onboarded && (
          <Redirect to={APP.AUTH.ONBOARDING}/>
        )}
        {user.id && user.onboarded && (
          <Redirect to={APP.AUTH.LOGOUT}/>
        )}
        <Route path={APP.AUTH.LOGOUT} component={TemporaryLogout} />
        <Route path={APP.AUTH.ONBOARDING} component={Onboarding}/>
        <Route path={APP.AUTH.LOGIN} component={Login} />
        <Route path={APP.AUTH.FORGOT} component={ForgotPassword} />
        <br /><br /><br />
      </AuthMain>

      <AuthAside>
      <AppDescription width={'100%'} height={'100%'} fill={theme.fontFocus} stroke={theme.backgroundNormal} stroke-width={'0.2'}/>

      </AuthAside>
    </Container>
  );
};

export default Auth;
