// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Permissions } from '@prisma/client';
import { hasPermission } from '@src/lib/role';
import HttpStatus from 'http-status-codes';

import prisma from 'api2/prisma';
import createHandler, { requireAuthMiddleware } from 'lib/nextconnect';
import { Join, Leave } from 'types/requests/member';
const handler = createHandler();
handler.use(requireAuthMiddleware);

// DELETE /member/:id (leave community, id is communityId)
handler.delete(async (req: Leave, res) => {
  const communityId = req.query.id;
  const { id } = await prisma.user.findUnique({
    where: {
      authId: req.authId,
    },
  });
  const response = await prisma.member.delete({
    where: {
      membership: {
        communityId: BigInt(communityId),
        userId: id,
      },
    },
  });
  
  res.json(response);
});
// ADD /member/:id (id is communityId)
handler.post(async (req: Join, res) => {
  const communityId = req.query.id;
  if (!communityId) res.status(HttpStatus.BAD_REQUEST);
  const { id, memberships } = await prisma.user.findUnique({
    where: {
      authId: req.authId,
    },
    include: {
      memberships: {
        where: {
          communityId: BigInt(communityId),
        },
      },
    },
  });

  if (!memberships || memberships.length === 0) {//Already a members {
    const response = await prisma.member.create({
      data: {
        communityId: BigInt(communityId),
        role: Permissions.MEMBER,
        userId: id,
      },
    });
    res.json(response);
  } else if (memberships.length > 0) {
    res.json(memberships[0]);
  } else {
    res.status(HttpStatus.INTERNAL_SERVER_ERROR);
  }
  
});

export type MemberUpdateRequest = {
  userId: bigint,
  communityId: bigint, 
  role: Permissions,
};

// PUT /member/:id (leave community, id is communityId)
handler.put(async (req: Leave, res) => {
  const communityId = BigInt(req.query.id as string);
  const typedBody = req.body as MemberUpdateRequest;
  const { id, memberships, communities } = await prisma.user.findUnique({
    where: {
      authId: req.authId,
    },
    include: {
      memberships: {
        where: {
          communityId: communityId,
        },
      },
      communities: {
        where: {
          id: communityId,
        },
      },
    },
  });
  //Check that requesting user has permissions equal or higher to the permission they are setting
  // communities supercedes permission since that indicates ownership
  if (memberships && (communities || hasPermission(memberships[0].role, typedBody.role))) {
    const response = await prisma.member.update({
      where: {
        membership: {
          communityId: communityId,
          userId: BigInt(typedBody.userId as unknown as string),
        },
      },
      data: {
        role: typedBody.role,
      },
    });
    
    res.json(response);  
  } else {
    console.error('You cannot set permissions of other users higher than your own');
    res.status(HttpStatus.FORBIDDEN).end();
  }
  
});

export default handler;
