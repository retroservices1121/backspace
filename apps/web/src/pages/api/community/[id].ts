// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import prisma from '@src/api2/prisma';
import { Permissions, Prisma } from '@prisma/client';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';
const handler = createHandler();

handler
  .use(requireAuthMiddleware) // must be signed in
  .put(async (req, res) => {
    const { 
      query: { id },
      body,
      authId,
    } = req;
    const bodyTyped = body as Prisma.CommunityUpdateInput;
    //Check that user has permission
    const myUser = await prisma.user.findUnique({
      where: {
        authId: authId,
      },
      include: {
        memberships: true,
      },
    });
    const communityRole = myUser.memberships.find((mem) => mem.communityId === BigInt(id as string))?.role;
    if (communityRole >= Permissions.ADMIN) {
      const community = await prisma.community.update(
        { 
          where: {
            id: BigInt(id as string),
          },
          data: bodyTyped, 
        },
      );
      res.json(community);
    } else {
      res.status(HttpStatus.FORBIDDEN);
    }
  });

export default handler;
