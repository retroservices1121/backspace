import React from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import { usePrivy } from '@privy-io/react-auth';
import useAuthentication from '@src/hooks/useAuthenticate';
import { AuthStatus } from '@src/store/authSlice';
import { logout } from '@src/store/userSlice';
import { Button } from '@src/styles/Buttons';
import AuthLayout from 'layouts/authLayout';
import { useRouter } from 'next/router';

import { APP } from 'pages';
import { RootState, useAppDispatch, useAppSelector } from 'store/store';

const ManualLogout: ReactLayoutComponentType = () => {
  const username = useAppSelector((state: RootState) => state.user.username);
  const email = useAppSelector((state: RootState) => state.auth.email);
  const authState = useAuthentication();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { logout: privyLogout } = usePrivy();

  // Tear down the Privy session first; useAuthenticate observes the
  // resulting !authenticated state and dispatches logout / clearAuthSlice.
  // The thunk dispatch here is belt-and-braces for a clean local state
  // reset in case the Privy event lands a tick later than the user expects.
  const handleLogout = async () => {
    await privyLogout();
    dispatch(logout('User Initiated Logout'));
  };

  return (
    authState === AuthStatus.SignedIn ? (
      <div style={{ marginTop: '50px' }}>
        <h4>
          This is a page for manually signing out.
          <br/>
          If you hit this, sorry!
        </h4>
        <br />
        <h4>Currently is signed in as:</h4>
        <h5>{email}</h5>
        <h5>{username}</h5>
        <br />
        <Button color="none" onClick={handleLogout}>Logout</Button>
      </div>
    ) : (
      <>
      {/* I am not sure I did this right */}
      <div onClick={() => router.push(APP.AUTH.LOGIN)}>Login</div>
      </>
    )
  );
};

ManualLogout.Layout = AuthLayout;
export default ManualLogout;

