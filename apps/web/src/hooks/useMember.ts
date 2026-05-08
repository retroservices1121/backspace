// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Permissions } from '@prisma/client';
import { MemberUpdateRequest } from '@src/pages/api/member/[id]';

import { useAxios } from './useAxios';

export const useMembership = () => {
  const axios = useAxios();

  const add = () => {
    throw new Error('Not Implemented');
  };

  const update = (communityId: bigint, userId: bigint, role: Permissions) => {
    const updateLevel : MemberUpdateRequest = {
      communityId,
      userId,
      role,
    };
    return axios.put(`/member/${communityId}`, updateLevel);
  };

  const remove = () => {
    throw new Error('Not Implemented');
  };

  return {
    add, 
    update,
    delete : remove, 
  };
};

export default useMembership;
