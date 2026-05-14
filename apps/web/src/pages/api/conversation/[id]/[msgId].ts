// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from 'lib/nextconnect';
import { Rest } from 'types/utilityTypes';

const handler = createHandler();
handler.use(requireAuthMiddleware);

// PATCH  /conversation/:id/:msgId    Edit message
handler.patch(async (req, res) => {
  res.send('Not implemented');
  throw new Error('Not Implemented yet');
});


// DELETE /conversation/:id/:msgId    Delete message
handler.delete(async (req: Rest<{ id: string; msgId: string; }>, res) => {
  const { query: { id, msgId } } = req;
  const msg = await prisma.message.delete({
    where: { id: BigInt(msgId) },
  });

  return msg;
});

export default handler;