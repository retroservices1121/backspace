// The wallet provider doesn't distinguish login from register —
// same modal, same flow. We keep /auth/register as a separate URL
// so existing inbound links resolve; it opens the provider's modal
// then routes to onboarding on first sign-in.

import React, { useEffect } from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import { useRouter } from 'next/router';
import { useWallet } from '@src/lib/wallet';
import useAuthentication from '@src/hooks/useAuthenticate';
import { AuthStatus } from '@src/store/authSlice';
import AuthLayout from 'layouts/authLayout';

import { APP } from 'pages';
import { setPageTitle } from 'store/appSlice';
import { useAppDispatch } from 'store/store';

const pageTitle = 'Create account';

const Register: ReactLayoutComponentType = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const authStatus = useAuthentication();
  const { ready, authenticated, login } = useWallet();

  useEffect(() => { dispatch(setPageTitle(pageTitle)); }, []);

  useEffect(() => {
    if (authStatus === AuthStatus.SignedIn) {
      router.push(APP.AUTH.ONBOARDING);
    }
  }, [authStatus]);

  return (
    <>
      <h1 className="m-0 text-[24px] font-bold tracking-[-0.02em] text-ink">
        Create your account
      </h1>
      <p className="mt-2 text-[14px] text-ink-2 leading-snug">
        Email, Google, Apple, or a wallet. Backspace creates your handle and
        a self-custodial wallet in one step.
      </p>

      <button
        type="button"
        onClick={login}
        disabled={!ready || authenticated}
        className="
          mt-6 w-full h-[48px] rounded-full
          bg-brand hover:bg-brand-2
          text-ink text-[14px] font-semibold
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-150
          shadow-[0_12px_30px_-8px_rgba(88,34,251,0.6)]
        "
      >
        Continue
      </button>

      <p className="mt-4 text-center text-[12px] text-ink-3">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => router.push(APP.AUTH.LOGIN)}
          className="text-brand-2 hover:underline"
        >
          Sign in
        </button>
      </p>
    </>
  );
};

Register.Layout = AuthLayout;

export default Register;
