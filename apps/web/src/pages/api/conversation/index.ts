// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import createHandler, { requireAuthMiddleware } from 'lib/nextconnect';


const handler = createHandler();
handler.use(requireAuthMiddleware);

// GET    /conversation/      Get all user conversations
handler.get((req, res) => {
  // Currently, this data comes from 
  res.send('Not implemented');
  throw new Error('Not Implemented yet');
});


// POST   /conversation/      Create conversation
handler.post(async (req, res) => {
  const authId = req.authId;
  const convo = await prisma.conversation.create({
    data: { members: { connect: { authId } } },
  });

  return res.status(200).json(convo);
});

export default handler;
