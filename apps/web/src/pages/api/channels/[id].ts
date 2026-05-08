// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { paginate } from '@src/lib/pagination';
import { Rest } from '@src/types/utilityTypes';

const handler = createHandler();
handler.use(requireAuthMiddleware);

// GET /channels/:id (get channel with all messages)
handler.get(async (req: Rest, res) => {
  const { id } = req.query;

  const channel = await prisma.channel.findUnique({
    where: { id: BigInt(id) },
    include: {
      messages: {
        include: { author: true },
        ...paginate(),
      },
    },
  });

  res.json(channel);
});

export default handler;