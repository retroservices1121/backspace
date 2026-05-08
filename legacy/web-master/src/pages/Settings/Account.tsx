// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

//import MediaAPI from 'api/mediaAPI';
import React from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { isUsernameAvailable } from 'api/auth';
import { fireStorage } from 'api/firebase';
import { updateUserInfo, updateUserPrivateInfo } from 'api/userAPI';
import { Collections, PrivateUserDocument, UserDocument } from 'shared/types/documents';
import { RootState } from 'store/store';
import { AccountFields, AccountFormState } from 'types/settings';

import AccountForm from './components/AccountForm';
import { Container } from './styled';

const Account: React.FC<any> = () => {
  const uid = useSelector((state : RootState) => state.user.id);

  const handleSubmit = async (form : AccountFormState) => {
    if (uid) {
      let publicUpdate : Partial<UserDocument> = {};
      if (form[AccountFields.Username]) {
        const username = form[AccountFields.Username].trim();
        const available = await isUsernameAvailable(uid, username);
        if (!available) {
          toast.error('Username is taken. Please select another.');
          return;
        }
        publicUpdate.username = username;
      }
      if (form[AccountFields.Description]) {publicUpdate.description = form[AccountFields.Description];}
      if (form[AccountFields.Description] === '') {publicUpdate.description = '';} // Allow a user to clear their bio
      if (form[AccountFields.DisplayName]) {
        publicUpdate.display_name = form[AccountFields.DisplayName].trim();
        publicUpdate.search_name = form[AccountFields.DisplayName].toLocaleLowerCase().trim();
      }

      if (form[AccountFields.ProfilePic] instanceof File) {
        let media = form[AccountFields.ProfilePic] as File;
        const profileMediaPath = `${Collections.Users}/${uid}/${media.name}`;
        try {
          await fireStorage.uploadFile(profileMediaPath, media);
        } catch (error) {
          toast.error('Banner limit is 10MB');
        }
        publicUpdate.profile_image = profileMediaPath;
      }

      let bannerMediaPath = '';
      if (form[AccountFields.BannerPic] instanceof File) {
        let media = form[AccountFields.BannerPic] as File;
        //TODO need unique media name so it doesn't overwrite something with the same name
        bannerMediaPath = `${Collections.Users}/${uid}/${media.name}`;
        try {
          await fireStorage.uploadFile(bannerMediaPath, media);
        } catch (error) {
          toast.error('Profile picture limit is 10MB');
        }
        publicUpdate.banner_image = bannerMediaPath;
      }
      updateUserInfo(uid, publicUpdate);

      // Update user's private document
      let privateUpdate : Partial<PrivateUserDocument> = {};
      if (form[AccountFields.Firstname]) {privateUpdate.first_name = form[AccountFields.Firstname];}
      if (form[AccountFields.Lastname]) {privateUpdate.last_name = form[AccountFields.Lastname];}
      if (form[AccountFields.PhoneNumber]) {privateUpdate.phone_number = form[AccountFields.PhoneNumber];}
      if (form[AccountFields.DateOfBirth]) {privateUpdate.dob = form[AccountFields.DateOfBirth];}
      updateUserPrivateInfo(uid, privateUpdate);
      toast.info('Saved');
    } else {
      console.log('missing uid');
      toast.error('Error saving changes.');
    }
  };

  return (
    <Container>
      <AccountForm onSubmit={handleSubmit}/>
    </Container>
  );
};
export default Account;
