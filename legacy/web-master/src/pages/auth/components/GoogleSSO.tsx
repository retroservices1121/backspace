import React from 'react';
import { browserLocalPersistence, GoogleAuthProvider, setPersistence, signInWithRedirect } from '@firebase/auth';
import log from 'loglevel';

import googleLogo from 'graphics/google-logo.svg';
import { auth } from 'util/firebase';

import { SSO } from './styles';

// Google Auth. Might have to swap the popup for a redirect for mobile support

//TODO this file wasn't editied

const GoogleSSO = ({
  rememberMe = '',
  isLogin = false,
}) => {
  const provider = new GoogleAuthProvider();


  async function googlePopup() {
    const functionName = 'Auth | googlePopup';
    if (rememberMe) {
      log.debug('Setting Auth Persistance to local', functionName);
      setPersistence(auth, browserLocalPersistence); // Default persistence is 'session'
    }

    await signInWithRedirect(auth, provider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        // for debugging
        // const credential = GoogleAuthProvider.credentialFromResult(result);
        // const token = credential.accessToken;

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
        // const credential = GoogleAuthProvider.credentialFromError(error);
        log.error(`Google Login | Failed to auth ${email}, ${errorCode}`);
      });
  }

  return (
    <SSO onClick={googlePopup}>
      <span className="flex">
        <img width="30px" className="mx-3" src={googleLogo} />
        {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
      </span>
    </SSO>
  );
};

export default GoogleSSO;
