// Account settings — Postgres-backed via PATCH /api/user and PATCH
// /api/private. Avatar and banner uploads use the same mediaStorage +
// PUT /api/media?relationId={uid} pattern as useOnboarding; the PUT
// branch upserts so a re-upload replaces the existing Media row instead
// of accumulating dead records.
import React from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { MediaUse } from '@prisma/client';
import settingsLayout from '@src/layouts/settingsLayout';
import axios from '@src/lib/axios';
import { mediaStorage } from '@src/lib/media';
import { CreateMediaBody } from '@src/types/requests/media';
import { getFileExtension } from '@src/utils/common_utils';

import AccountForm from 'components/Settings/AccountForm';
import { Container } from 'components/Settings/styledAgain';
import { RootState } from 'store/store';
import { AccountFields, AccountFormState } from 'types/settings';

import type { UpdateUserBody } from '../api/user';
import type { UpdatePrivateBody } from '../api/private';

const Account: ReactLayoutComponentType = () => {
  const uid = useSelector((state: RootState) => state.user.id);
  const authId = useSelector((state: RootState) => state.user.authId);

  const handleSubmit = async (form: AccountFormState) => {
    if (!uid || !authId) {
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

    try {
      const requests: Promise<unknown>[] = [];
      if (Object.keys(userUpdate).length > 0) {
        requests.push(axios().patch('/user', userUpdate));
      }
      if (Object.keys(privateUpdate).length > 0) {
        requests.push(axios().patch('/private', privateUpdate));
      }

      // Avatar / banner uploads — same flow as useOnboarding, with PUT
      // instead of POST so the upsert replaces an existing Media row.
      const profilePic = form[AccountFields.ProfilePic];
      if (profilePic instanceof File) {
        requests.push(
          uploadUserMedia(uid.toString(), authId, profilePic, MediaUse.AVATAR),
        );
      }
      const bannerPic = form[AccountFields.BannerPic];
      if (bannerPic instanceof File) {
        requests.push(
          uploadUserMedia(uid.toString(), authId, bannerPic, MediaUse.BANNER),
        );
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

// Uploads file to storage, then PUT /api/media to upsert the user's
// avatar or banner Media row keyed by the corresponding unique relation
// (avatarUserId / bannerUserId).
async function uploadUserMedia(
  userId: string,
  authId: string,
  file: File,
  type: typeof MediaUse.AVATAR | typeof MediaUse.BANNER,
) {
  const ms = mediaStorage(type);
  const path = ms.getPath(userId, file.name);
  const ok = await ms.uploadFile(path, file);
  if (!ok) return;
  const body: CreateMediaBody = {
    type,
    host: ms.host,
    path,
    fileExtension: getFileExtension(file),
    ...(type === MediaUse.AVATAR
      ? { avatarUser: { connect: { authId } } }
      : { bannerUser: { connect: { authId } } }),
  };
  await axios().put(`/media?relationId=${userId}`, body);
}

Account.Layout = settingsLayout;

export default Account;
