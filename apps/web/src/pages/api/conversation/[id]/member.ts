// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { joinConversation } from '@src/api2/conversation';

import createHandler, { requireAuthMiddleware } from 'lib/nextconnect';


const handler = createHandler();
handler.use(requireAuthMiddleware);

// POST   /conversation/:id/member           Send message
handler.put(async (req, res) => {
  const {
    query: { id },
    body: { username },
  } = req;

  const convo = joinConversation(BigInt(id as string), { username } );
  if (convo) {
    return res.status(200).json(convo);
  } else {
    return res.status(404).json({ err: 'Something went wrong, helpful, I know.' });
  }
});


// PATCH  /conversation/:id   Update conversation
handler.patch(async (req, res) => {
  res.send('Not implemented');
  throw new Error('Not Implemented yet');
});

// DELETE  /conversation/:id   Leave conversation (delete if all have left)
handler.delete(async (req, res) => {
  res.send('Not implemented');
  throw new Error('Not Implemented yet');
});

export default handler;
