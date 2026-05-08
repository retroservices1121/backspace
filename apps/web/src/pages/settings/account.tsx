// Account settings — Postgres-backed via PATCH /api/user and PATCH
// /api/private. The legacy Firestore writes (updateUserInfo /
// updateUserPrivateInfo) and the fireStorage avatar/banner uploads were
// removed during the Firebase cleanup pass; the original file mapped
// `display_name` / `description` / `profile_image` to Firestore-only
// columns that no longer exist.
//
// Avatar and banner uploads are not handled here yet — they use the same
// `mediaStorage` + POST /api/media flow as useOnboarding and will land in
// a follow-up. For now the form ignores ProfilePic/BannerPic file fields
// and toasts a heads-up if the user tries to set one.
import React from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import settingsLayout from '@src/layouts/settingsLayout';
import axios from '@src/lib/axios';

import AccountForm from 'components/Settings/AccountForm';
import { Container } from 'components/Settings/styledAgain';
import { RootState } from 'store/store';
import { AccountFields, AccountFormState } from 'types/settings';

import type { UpdateUserBody } from '../api/user';
import type { UpdatePrivateBody } from '../api/private';

const Account: ReactLayoutComponentType = () => {
  const uid = useSelector((state: RootState) => state.user.id);

  const handleSubmit = async (form: AccountFormState) => {
    if (!uid) {
      toast.error('Error saving changes.');
      return;
    }

    const userUpdate: UpdateUserBody = {};
    if (form[AccountFields.Username]) userUpdate.username = form[AccountFields.Username];
    if (form[AccountFields.DisplayName]) userUpdate.name = form[AccountFields.DisplayName];
    // Allow clearing the bio explicitly; treat undefined as "no change".
    if (typeof form[AccountFields.Description] === 'string') userUpdate.bio = form[AccountFields.Description];

    const privateUpdate: UpdatePrivateBody = {};
    if (form[AccountFields.Firstname]) privateUpdate.firstName = form[AccountFields.Firstname];
    if (form[AccountFields.Lastname]) privateUpdate.lastName = form[AccountFields.Lastname];
    if (form[AccountFields.PhoneNumber]) privateUpdate.phone = form[AccountFields.PhoneNumber];
    const dob = form[AccountFields.DateOfBirth];
    if (dob) {
      privateUpdate.dobYear = dob.year;
      privateUpdate.dobMonth = dob.month;
      privateUpdate.dobDay = dob.day;
    }

    if (form[AccountFields.ProfilePic] instanceof File || form[AccountFields.BannerPic] instanceof File) {
      toast.info('Avatar and banner uploads from settings are coming soon.');
    }

    try {
      const requests: Promise<unknown>[] = [];
      if (Object.keys(userUpdate).length > 0) {
        requests.push(axios().patch('/user', userUpdate));
      }
      if (Object.keys(privateUpdate).length > 0) {
        requests.push(axios().patch('/private', privateUpdate));
      }
      if (requests.length === 0) {
        toast.info('No changes to save.');
        return;
      }
      await Promise.all(requests);
      toast.info('Saved');
    } catch (error) {
      console.error(error);
      toast.error('Error saving changes.');
    }
  };

  return (
    <Container>
      <AccountForm onSubmit={handleSubmit} />
    </Container>
  );
};

Account.Layout = settingsLayout;

export default Account;
