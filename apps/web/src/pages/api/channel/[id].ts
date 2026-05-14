// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import prisma from '@src/api2/prisma';
import { Permissions, Prisma } from '@prisma/client';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';
const handler = createHandler();

export type ChannelCreateRequest = {
  communityId: bigint,
  channel: Prisma.ChannelCreateInput
};

handler
  .use(requireAuthMiddleware) // must be signed in
  .put(async (req, res) => {
    const {
      query: { id },
      body,
      authId,
    } = req;
    const bodyTyped = body as ChannelCreateRequest;
    //Check that user has permission
    const myUser = await prisma.user.findUnique({
      where: {
        authId: authId,
      },
      include: {
        memberships: true,
        communities: true,
      },
    });
 
    const communityRole = myUser.memberships.find((mem) => mem.communityId == bodyTyped.communityId)?.role;
    const ownedCommunity = myUser.communities.find((com) => com.id == bodyTyped.communityId);
    if (ownedCommunity != undefined || communityRole >= Permissions.ADMIN) {
      const channel = await prisma.channel.update({
        where: {
          id: BigInt(id as string),
        },
        data: {
          ...bodyTyped.channel,
          writePermission: Permissions[bodyTyped.channel.writePermission],
          readPermission: Permissions[bodyTyped.channel.readPermission],
          community:
          {
            connect: {
              id: BigInt(bodyTyped.communityId),
            },
          },
        },
      });
      res.json(channel);
    } else {
      res.status(HttpStatus.FORBIDDEN);
    }
  });

export default handler;
