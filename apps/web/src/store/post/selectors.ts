// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import createParamSelector from '@src/hooks/createParamSelector';

import { RootState } from 'store/store';

export const selectMembership = createParamSelector((state: RootState, postCommunityId: bigint) => {
  return state.user.memberships?.find(
    (membership) => membership.communityId === postCommunityId,
  );
});

export const selectFollow = createParamSelector((state: RootState, authorId: bigint) : boolean => {
  const result = state.user.following?.find(
    (follow) => follow.accountId === authorId,
  );
  return result ? true : false;
});
