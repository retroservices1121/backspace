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
import { isDevelopment } from 'shared/common_utils';
import { PrivateUserDocument, UserDocument, UserDocumentMeta } from 'shared/types/documents';
import { ForgotPasswordState, OnboardingFields, OnboardingFormState, RegisterFormState } from 'types/auth';
import { auth } from 'util/firebase';

import { setFollowUser, updateUserInfo, updateUserPrivateInfo, UserTable } from './userAPI';

export const createUser = async ({ email, password } : RegisterFormState) => {
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

//Cases to account for with this function
// Multiple users have same username and one of them is me (true)
// Multiple users have this username and none of them are me (false)
// One user has this username and it is me (true)
// One user has this username and it is not me (false)
// One user has this username, it is reserved, and it is me (true)
// No one has this uesrname and it is reserved (false)
// No one has this username and it is not reserved (true)
export async function isUsernameAvailable(uid: string, username: string) {
  const matches = await UserTable.query(where('username', '==', username));
  if (matches.length >= 1) { // Someone with name exists
    for (const match of matches) {
      if (match.id === uid) { // Is it the same user trying to update their profile?
        return true;
      }    
    }
    // user has username and it isn't me
    return false;
  }

  //Check if username is reserved
  const userMeta = await UserTable.getMeta<UserDocumentMeta>();
  return !userMeta?.reserved.includes(username);
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
