// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useState } from 'react';
import { MediaUse } from '@prisma/client';
import { useAxios } from '@src/hooks/useAxios';
import useUser from '@src/hooks/useUser';
import { mediaStorage } from '@src/lib/media';
import { CreateMediaBody } from '@src/types/requests/media';
import { CreatePrivateUserBody, CreateUserBody, CreateUserStateBody } from '@src/types/requests/user';
import { getFileExtension } from '@src/utils/common_utils';
import { defaultAvatar } from '@src/utils/constants';
import { v4 as uuidv4 } from 'uuid';

import { RootState,  useAppSelector } from 'store/store';
import { OnboardingFields, OnboardingFormState } from 'types/auth';

export const useOnboarding = () => {
  const axios = useAxios(); 
  const { user } = useUser();
  const auth  = useAppSelector((state: RootState) => state.auth);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(user?.state?.onboarded);

  const checkUsername = async (username: string) => {
    const func1 = axios.get(`user?username=${username}`);
    const func2 = axios.get(`reserveduser?username=${username}`);
    
    const userResult = (await func1).data;
    const reservedResult = (await func2).data;
    const available = userResult.id ? userResult.id === user.id : true;
    const isReserved = reservedResult ? reservedResult.length > 0 : false;

    if (!available || isReserved) {
      return false;
    } else {
      return true;
    }
  };

  const submitOnboarding = async (formState: OnboardingFormState) => {
    const displayName = `${formState[OnboardingFields.Firstname]} ${formState[OnboardingFields.Lastname]}`;
    const myUUID = uuidv4();
    const myUser : CreateUserBody = {
      username: formState[OnboardingFields.Username],
      name: displayName,
      authId: auth.authId,
      uuid: myUUID,
    };
    const { data : newUser } = await axios.post('user', myUser);
    if (!newUser) {
      return false;
    }
    //Create private
    //TODO don't use prisma directly
    const newPrivateUser : CreatePrivateUserBody = {
      user: {
        connect: {
          authId: auth.authId,
        },
      },
      firstName: formState[OnboardingFields.Firstname],
      lastName: formState[OnboardingFields.Lastname],
      email: auth.email,
      dobYear: formState[OnboardingFields.DateOfBirth].year,
      dobMonth: formState[OnboardingFields.DateOfBirth].month,
      dobDay: formState[OnboardingFields.DateOfBirth].day,
    };
    const submitPrivate = axios.post('private', newPrivateUser);
    //Create userstate
    //TODO don't use prisma directly
    const newUserState : CreateUserStateBody = {
      user: {
        connect: {
          authId: auth.authId,
        },
      },
      onboarded: true,
    };
    const submitUserState = axios.post('userstate', newUserState);
    //On Success, add profile picture
    let profilePicture = formState[OnboardingFields.ProfilePic];
    const ms = mediaStorage(MediaUse.AVATAR);
    // Use user supplied image
    if (profilePicture && profilePicture instanceof File) {
      const result = await ms.uploadFile(profilePicture, myUUID);
      if (result.ok) {
        const newMedia : CreateMediaBody = {
          type: MediaUse.AVATAR,
          host: ms.host,
          path: result.path,
          fileExtension: getFileExtension(profilePicture),
          avatarUser: {
            connect: {
              authId: auth.authId,
            },
          },
        };
        axios.post('media', newMedia);
      }
    } else { //Use default image
      console.log('No image supplied, using default images');
      const newMedia : CreateMediaBody = {
        type: MediaUse.AVATAR,
        host: ms.host,
        path: defaultAvatar(),
        fileExtension: 'PNG',
        avatarUser: {
          connect: {
            authId: auth.authId,
          },
        },
      };
      axios.post('media', newMedia);
    }

    await Promise.all([submitPrivate, submitUserState, newUser]);
    return true;
  };

  return {
    isOnboarded,
    checkUsername,
    submit: submitOnboarding,
  };
};
