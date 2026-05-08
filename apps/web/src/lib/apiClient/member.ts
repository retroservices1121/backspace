// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Permissions } from '@prisma/client';

import axios from '../axios';

const Member = (route: string) => ({

  // DELETE /member/:uuid
  leaveCommunity(id: bigint) {
    return axios().delete(`${route}/${id}`);
  },

  // POST /member/:id
  joinCommunity(id: bigint) {
    return axios().post(`${route}/${id}`);
  },

  changeRole(uuid: string, role: Permissions) {
    throw new Error('Not implemented');
  },
});


export default Member;
