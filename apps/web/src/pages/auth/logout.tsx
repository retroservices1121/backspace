// Manual logout route. Existing inbound links land here when the
// user wants to explicitly sign out (e.g. from the settings sub-
// nav or a stale device). Signed-out users get a "Back to sign
// in" CTA so the dead-end doesn't feel dead-end.

import React from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import { useRouter } from 'next/router';
import useAuthentication from '@src/hooks/useAuthenticate';
import useLogout from '@src/hooks/useLogout';
import { AuthStatus } from '@src/store/authSlice';
import AuthLayout from 'layouts/authLayout';

import { APP } from 'pages';
import { RootState, useAppSelector } from 'store/store';

const ManualLogout: ReactLayoutComponentType = () => {
  const username = useAppSelector((state: RootState) => state.user.username);
  const email = useAppSelector((state: RootState) => state.auth.email);
  const authState = useAuthentication();
  const router = useRouter();
  const logout = useLogout();

  const handleLogout = () => logout('User Initiated Logout');

  if (authState === AuthStatus.SignedIn) {
    return (
      <>
        <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em] text-ink">
          Sign out
        </h1>
        <p className="mt-2 text-[14px] text-ink-2 leading-snug">
          You&apos;re currently signed in as:
        </p>
        <div className="mt-4 rounded-[10px] border border-line bg-canvas px-4 py-3">
          {email && (
            <div className="text-[13px] text-ink font-mono break-all">{email}</div>
          )}
          {username && (
            <div className="mt-0.5 text-[12px] text-ink-3 font-mono break-all">
              @{username}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="
            mt-6 w-full h-[48px] rounded-full
            bg-pink-vivid/15 border border-pink-vivid/30
            text-pink-2 text-[14px] font-semibold
            hover:bg-pink-vivid/25 transition-colors duration-150
          "
        >
          Sign out
        </button>
      </>
    );
  }

  return (
    <>
      <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em] text-ink">
        You&apos;re signed out
      </h1>
      <p className="mt-2 text-[14px] text-ink-2 leading-snug">
        See you next time.
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
        Back to sign in
      </button>
    </>
  );
};

ManualLogout.Layout = AuthLayout;

export default ManualLogout;
