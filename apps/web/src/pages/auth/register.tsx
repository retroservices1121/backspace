// Privy does not distinguish login from register — same modal, same flow.
// We keep /auth/register as a separate URL so existing inbound links still
// resolve, but it just opens the Privy modal like /auth/login.
import React, { useEffect } from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import useAuthentication from '@src/hooks/useAuthenticate';
import { AuthStatus } from '@src/store/authSlice';
import { usePrivy } from '@privy-io/react-auth';
import AuthLayout from 'layouts/authLayout';
import { useRouter } from 'next/router';

import { APP } from 'pages';
import { setPageTitle } from 'store/appSlice';
import { useAppDispatch } from 'store/store';
import { Button } from 'styles/form';

const pageTitle = 'Create Account';

const Register: ReactLayoutComponentType = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const authStatus = useAuthentication();
  const { ready, authenticated, login } = usePrivy();

  dispatch(setPageTitle(pageTitle));

  useEffect(() => {
    if (authStatus === AuthStatus.SignedIn) {
      router.push(APP.AUTH.ONBOARDING);
    }
  }, [authStatus]);

  return (
    <>
      <h1>{pageTitle}</h1>
      <h5>Let's connect with your communities around the world!</h5>

      <Button disabled={!ready || authenticated} onClick={login}>
        Continue
      </Button>
    </>
  );
};

Register.Layout = AuthLayout;

export default Register;
