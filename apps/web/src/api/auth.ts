// NOTE: The Firebase-Auth flow that used to live here (registerUser,
// logoutUser, updateUserPassword, resetPassword) was removed during the Privy
// migration on 2026-05-08. Sign-in is now driven by `usePrivy()` from the
// auth pages directly.
//
// The username and onboarding helpers below still talk to Firestore — they
// are part of the open Firebase-cleanup item (api/* → api2/*) and will be
// rewritten to hit Postgres via @backspace/db.
import { toast } from 'react-toastify';
import { where } from 'firebase/firestore';

import { fireStorage } from 'api/firebase';
import { OnboardingFields, OnboardingFormState } from 'types/auth';
import { PrivateUserDocument, UserDocument, UserDocumentMeta } from 'types/documents';
import { isDevelopment } from 'utils/common_utils';

import { setFollowUser, updateUserInfo, updateUserPrivateInfo, UserTable } from './userAPI';

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
