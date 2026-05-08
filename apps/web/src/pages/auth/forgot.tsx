// Privy is passwordless — there is no "forgot password" flow. Existing
// inbound links land here and bounce to /auth/login.
import React, { useEffect } from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import AuthLayout from 'layouts/authLayout';
import { useRouter } from 'next/router';

import { APP } from 'pages';
import { setPageTitle } from 'store/appSlice';
import { useAppDispatch } from 'store/store';
import { ClickableSpan } from 'styles/Buttons';
import { Space } from 'styles/layout';

const pageTitle = 'Sign in';

const Forgot: ReactLayoutComponentType = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  dispatch(setPageTitle(pageTitle));

  useEffect(() => {
    const t = setTimeout(() => router.push(APP.AUTH.LOGIN), 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <h1>{pageTitle}</h1>
      <h5>
        Sign-in is passwordless — you'll get a one-time code by email, or you
        can connect with Google or a wallet.
      </h5>

      <Space direction="column" />

      <ClickableSpan onClick={() => router.push(APP.AUTH.LOGIN)}>
        Continue to sign in
      </ClickableSpan>
    </>
  );
};

Forgot.Layout = AuthLayout;

export default Forgot;
