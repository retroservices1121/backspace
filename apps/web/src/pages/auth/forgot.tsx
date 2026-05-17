// Privy is passwordless — there is no "forgot password" flow.
// Existing inbound links land here and bounce to /auth/login.

import React, { useEffect } from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import { useRouter } from 'next/router';
import AuthLayout from 'layouts/authLayout';

import { APP } from 'pages';
import { setPageTitle } from 'store/appSlice';
import { useAppDispatch } from 'store/store';

const pageTitle = 'Sign in';

const Forgot: ReactLayoutComponentType = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  useEffect(() => { dispatch(setPageTitle(pageTitle)); }, []);

  useEffect(() => {
    const t = setTimeout(() => router.push(APP.AUTH.LOGIN), 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em] text-ink">
        No password needed
      </h1>
      <p className="mt-2 text-[14px] text-ink-2 leading-snug">
        Sign-in is passwordless — you&apos;ll get a one-time code by email, or
        you can connect with Google or a wallet.
      </p>

      <button
        type="button"
        onClick={() => router.push(APP.AUTH.LOGIN)}
        className="
          mt-6 w-full h-[48px] rounded-full
          bg-brand hover:bg-brand-2
          text-ink text-[14px] font-semibold
          transition-colors duration-150
          shadow-[0_12px_30px_-8px_rgba(88,34,251,0.6)]
        "
      >
        Continue to sign in
      </button>

      <p className="mt-4 text-center text-[11px] font-mono text-ink-3">
        Redirecting in a moment…
      </p>
    </>
  );
};

Forgot.Layout = AuthLayout;

export default Forgot;
