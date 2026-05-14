// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import prisma from '@src/api2/prisma';
import { Permissions } from '@prisma/client';
import { hasPermission } from '@src/lib/role';

import createHandler, { requireAuthMiddleware } from 'lib/nextconnect';
import { CreateChannelBody } from 'types/requests/community';
import { Rest } from 'types/utilityTypes';

const handler = createHandler();
handler.use(requireAuthMiddleware);

// POST /communities/:id/channel/ (create channel)
handler.post(async (req: Rest<{ id: string }, CreateChannelBody>, res) => {
  const communityId = req.query.id;
  const body = req.body;
  const authId = req.authId;

  // https://linear.app/newsocial/issue/BS-610 check this security check works.
  const community = await prisma.community.findUnique({
    where: {
      id: BigInt(communityId),
    },
    select: {
      members: {
        where: { user: { authId } },
      },
    },
  });

  if (hasPermission(community.members[0].role, Permissions.ADMIN)) {
    const channel = await prisma.channel.create({
      data: {
        ...body,
        communityId: BigInt(communityId),
      },
    });
    return res.json(channel);
  }

  return res.status(401).json({ error: 'Not authorized to create channel' });

});

export default handler;
