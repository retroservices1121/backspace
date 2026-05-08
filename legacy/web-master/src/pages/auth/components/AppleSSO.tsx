import React from 'react';
import { browserLocalPersistence, OAuthProvider, setPersistence, signInWithRedirect } from '@firebase/auth';
import log from 'loglevel';
import { useTheme } from 'styled-components';

import { ReactComponent as AppleLogo } from 'graphics/apple-logo.svg';
import { auth } from 'util/firebase';

import { SSO } from './styles';

const AppleSSO = ({
  rememberMe = '',
  isLogin = false,
}) => {

  const provider = new OAuthProvider('apple.com');
  const theme = useTheme();

  async function applePopup() {
    const functionName = 'Auth | applePopup';
    if (rememberMe) {
      log.debug('Setting Auth Persistance to local', functionName);
      setPersistence(auth, browserLocalPersistence); // Default persistence is 'session'
    }

    await signInWithRedirect(auth, provider)
      .then((result) => {

        // The signed-in user info.
        const { user } = result;
        log.debug(user);
      }).catch((error) => {
        // alert.error('Could not complete signin. Please try again.');
        // Handle Errors here.
        const errorCode = error.code;
        // const errorMessage = error.message;
        // The email of the user's account used.
        const { email } = error;
        // The AuthCredential type that was used.
        // const credential = AppleAuthProvider.credentialFromError(error);
        log.error(`Apple Login | Failed to auth ${email}, ${errorCode}`);
      });
  }

  return (
    <SSO onClick={applePopup}>
      <span className="flex">
        <AppleLogo width={'30px'} height={'30px'} fill={theme.fontTertiary} className='mx-3' />
        {isLogin ? 'Sign in with Apple' : 'Sign up with Apple'}
      </span>
    </SSO>
  );
};

export default AppleSSO;
