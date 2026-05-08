// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { createSelector } from '@reduxjs/toolkit';
import createParamSelector from '@src/hooks/createParamSelector';

import { RootState } from 'store/store';

export const selectUser = (state: RootState) => state.user;
export const selectUserUuid = (state: RootState) => state.user.uuid;
export const selectMemberships = (state: RootState) => state.user.memberships;
export const selectUserConversations = (state: RootState) => state.user.conversations;


export const selectIsMember = createParamSelector((state: RootState, communityId: bigint) : boolean => {
  const result = state.user.memberships?.find(
    (mem) =>  mem.communityId === communityId,
  );
  return result ? true : false;
});