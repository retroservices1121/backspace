import React, { useEffect } from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import { useSelector } from 'react-redux';
import useAuthentication from '@src/hooks/useAuthenticate';
import { AuthStatus } from '@src/store/authSlice';
import AuthLayout from 'layouts/authLayout';
import { useRouter } from 'next/router';

import GoogleSSO from 'components/Auth/GoogleSSO';
import LoginForm from 'components/Auth/LoginForm';
import { APP } from 'pages';
import { setPageTitle } from 'store/appSlice';
import { RootState, useAppDispatch } from 'store/store';
import { formLogin } from 'store/userSlice';
import { Separator } from 'styles/Dividers';
import { LoginFormState } from 'types/auth';

const pageTitle = 'Login';


const Login: ReactLayoutComponentType = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const authStatus = useAuthentication();

  dispatch(setPageTitle(pageTitle));

  useEffect(() => {
    if (authStatus === AuthStatus.SignedIn) {
      router.push(APP.INDEX);
    }
  }, [authStatus]);


  const handleLogIn = (formState: LoginFormState) => {
    dispatch(formLogin(formState)).then(() => router.push(APP.INDEX));
  };

  return (
    <>
      <h1>{pageTitle}</h1>
      <h5>Let's connect with your communities around the world!</h5>

      <GoogleSSO isLogin />

      <Separator>
        Or Login with Email
      </Separator>

      <LoginForm
        onSubmit={handleLogIn}
        //FIXME: This need to pass the email & password to auth
        //stateFromRegister={router.push({ pathname: APP.AUTH.REGISTER, query: { RegisterFormState } })}
        onForgotPassword={() => router.push(APP.AUTH.FORGOT)}
      />
    </>
  );
};

Login.Layout = AuthLayout;

export default Login;
