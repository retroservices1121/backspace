// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import prisma from 'api2/prisma';
import { createHandler, requireAuthMiddleware } from 'lib/nextconnect';
import { Community } from 'types/prisma';

const handler = createHandler();
handler.use(requireAuthMiddleware);

// TODO only users with authId = authId should be able to receive this data.

// get /comunities/
handler.get(async (req, res) => {
  const authId = req.authId;
  const communities = await prisma.community.findMany({
    where: {
      members: {
        some: {
          user: {
            authId,
          },
        },
      },
    },
    include: Community.include,
  });
  return res.json(communities);
});

export default handler;
