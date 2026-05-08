import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import useRouting from 'hooks/useRouting';
import { APP } from 'pages';
import { setPageTitle } from 'store/appSlice';
import { RootState } from 'store/store';
import { formLogin } from 'store/userSlice';
import { Separator } from 'styles/Dividers';
import { LoginFormState, RegisterFormState } from 'types/auth';

import AppleSSO from './components/AppleSSO';
import GoogleSSO from './components/GoogleSSO';
import LoginForm from './components/LoginForm';

const pageTitle = 'Login';

type Props = {};

const Login: React.FC<Props> = () => {
  const history = useRouting();
  const dispatch = useDispatch();
  const location = useLocation<RegisterFormState>();

  const { isLoggedIn } = useSelector((state: RootState) => state.user);

  dispatch(setPageTitle(pageTitle));

  useEffect(() => {
    if (isLoggedIn) {
      history.push(APP.INDEX);
    }
  }, [isLoggedIn]);


  const handleLogIn = (formState: LoginFormState) => {
    dispatch(formLogin(formState));
  };

  return (
    <>
      <h1>{pageTitle}</h1>
      <h5>Let's connect with your communities around the world!</h5>

      <GoogleSSO isLogin />
      <AppleSSO isLogin/>
      <Separator>
        Or Login with Email
      </Separator>

      <LoginForm
        onSubmit={handleLogIn}
        stateFromRegister={location?.state}
        onForgotPassword={() => history.navigate(APP.AUTH.FORGOT)}
      />
    </>
  );
};

export default Login;
