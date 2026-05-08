// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Prisma } from '@prisma/client';
import { NewChannelState } from '@src/types/channel';

import { Channel, Community } from 'types/prisma';

import axios from '../axios';


// TODO remove this in favour of types defined in types/prisma
const getCommunityResponse = Prisma.validator<Prisma.CommunityArgs>()({
  include: {
    members: {
      include: {
        user: true,
      },
    },
    channels: true,
    owner: true,
  },
});

export type GetCommunityResponse = Prisma.CommunityGetPayload<typeof getCommunityResponse>;


const Communities = (route: string) => ({

  // GET /communities (authenticated route)
  getAll() {
    return axios().get<Community[]>(route);
  },
  // POST /communities/:id/channel/ (create channel)
  createChannel(communityId: bigint, newChannelArgs: NewChannelState) {
    return axios().post<Channel>(`${route}/${communityId}/`, newChannelArgs);
  },
});

export default Communities;
