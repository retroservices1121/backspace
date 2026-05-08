import { toast } from 'react-toastify';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from '@firebase/auth';
import {  signInWithEmailAndPassword } from 'firebase/auth';
import { updatePassword } from 'firebase/auth';
import { where } from 'firebase/firestore';
import log from 'loglevel';

import { fireStorage } from 'api/firebase';
import go from 'lib/async';
import logEvent, { EventMessages } from 'lib/events';
import { ForgotPasswordState, OnboardingFields, OnboardingFormState, RegisterFormState } from 'types/auth';
import { PrivateUserDocument, UserDocument, UserDocumentMeta } from 'types/documents';
import { isDevelopment } from 'utils/common_utils';
import { auth } from 'utils/firebase';

import { setFollowUser, updateUserInfo, updateUserPrivateInfo, UserTable } from './userAPI';

export const registerUser = async ({ email, password } : RegisterFormState) => {
  logEvent(EventMessages.Auth.New);
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    //@ts-ignore
    if (error.code == 'auth/email-already-in-use') {
      const response = await go(signInWithEmailAndPassword(auth, email, password));
      if (response.type === 'error') {
        toast.error('Please check your email and password.');
        throw response.error;
      }
    }
    console.error('Could not create account', error);
    throw new Error('Could not create account');
  }
};

export function logoutUser() {
  logEvent(EventMessages.Auth.Logout);
  return signOut(auth).catch(console.error);
}

export const updateUserPassword = (newPassword : string) => {
  logEvent(EventMessages.Auth.PasswordChange);
  const user = auth.currentUser;
  if (user) {
    return updatePassword(user, newPassword).then(() => {
      return true;
    }).catch((error) => {
      console.error(error);
      return false;
    });
  } else {
    return false;
  }

};

export function resetPassword({ email }: ForgotPasswordState) {
  logEvent(EventMessages.Auth.PasswordReset);
  return sendPasswordResetEmail(auth, email)
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      log.error(`Forgot Password | ${event} ${errorCode} ${errorMessage}`);
      // We throw after handling, so that the UI can also react to the error
      throw error;
    });
}

//TODO Move these functions somewhere else. I just don't want to collide with Sam's work in User atm
export async function isUsernameAvailable(uid: string, username: string) {
  const matches = await UserTable.query(where('username', '==', username));
  switch (matches.length) {
    // username available
    case 0: return true;
      // Make sure its not the currently logged in user
    case 1: return matches[0].id && matches[0].id == uid;
      // More than one match. Oh Shit
    default: {
      // FIXME this oh shit needs to be detected on the backend.
      //       we need to make a serverless function
      return false;
    }
  }
}

export async function isUsernameReserved(username: string) {
  let isReserved = true;
  const userMeta = await UserTable.getMeta<UserDocumentMeta>();
  if (userMeta) {
    // If we can't get the reserved list, don't let the user in.
    // We can handle this unlikely case better in the future.
    isReserved = userMeta.reserved.includes(username);
  }
  return isReserved;
}

const DEFAULT_PROFILE_PATH = 'users/default-user/';
function getDefaultProfilePic() {
  const random = Math.floor(Math.random() * 15) + 1; // from 1 to 15
  return `${DEFAULT_PROFILE_PATH}${random}.png`;
}

export const submitOnboarding = async (uid : string, formInput : OnboardingFormState) => {
  let displayName = `${formInput[OnboardingFields.Firstname]} ${formInput[OnboardingFields.Lastname]}`;
  let mediaPath : string | null = null;
  if (formInput[OnboardingFields.ProfilePic] instanceof File) {
    let media = formInput[OnboardingFields.ProfilePic] as File;
    mediaPath = `users/${uid}/${media.name}`;
    try {
      await fireStorage.uploadFile(mediaPath, media);
    } catch (error) {
      toast.error('File cannot be larger than 10MB');
    }
  }
  let publicUpdate : Partial<UserDocument> = {
    username: formInput[OnboardingFields.Username].toLowerCase(),
    display_name: displayName,
    search_name: displayName.toLowerCase() || '',
    onboarded: true,
  };

  // Set followed users to founders
  if (!isDevelopment()) {
    const dylanId = 'dVyeS0gmwnS6I6A0kYU05RZ1cXo1';
    const faizId = 'p8oSiI8aMXRQ3qh6yhflTAPXSjB2';
    setFollowUser(uid, dylanId, true);
    setFollowUser(uid, faizId, true);
  }

  //Set default if profile image is not supplied
  if (mediaPath != null) {
    publicUpdate.profile_image = mediaPath;
  } else {
    publicUpdate.profile_image = getDefaultProfilePic();
  }

  let privateUpdate : Partial<PrivateUserDocument> = {
    first_name: formInput[OnboardingFields.Firstname],
    last_name: formInput[OnboardingFields.Lastname],
  };
  if (formInput[OnboardingFields.DateOfBirth]) privateUpdate.dob = formInput[OnboardingFields.DateOfBirth] || undefined;
  updateUserInfo(uid, publicUpdate);
  updateUserPrivateInfo(uid, privateUpdate);
};
