// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import prisma from '@src/api2/prisma';
import { buildID, buildSubscriptionChannel, SubEvents } from '@src/lib/ably';
import { ablyLite } from '@src/lib/ablyServer';

import createHandler, { requireAuthMiddleware } from 'lib/nextconnect';
import { paginate } from 'lib/pagination';
import { Conversation } from 'types/prisma';
import { SendMessageInput } from 'types/requests/conversation';
import { Rest } from 'types/utilityTypes';


const handler = createHandler();
handler.use(requireAuthMiddleware);

// GET    /conversation/:id?lastId    Get messages
handler.get(async (req: Rest<{ id: string, lastId: string }>, res) => {
  const { query: { id, lastId } } = req;

  const conversation = await prisma.conversation.findUnique({
    where: { id: BigInt(id) },
    include: {
      ...Conversation.include,
      messages: {
        ...Conversation.include.messages,
        ...paginate(lastId),
      },
    },
  });

  return res.json(conversation);
});

// POST   /conversation/:id           Send message
handler.post(async (req: Rest<{ id: string }, SendMessageInput>, res) => {
  const body = req.body;
  const newMessage = await prisma.directMessage.create({
    data: {
      author: {
        connect: {
          id: BigInt(body.authorId),
        },
      },
      text: body.text,
      conversation: {
        connect: {
          id: BigInt(body.convoId),
        },
      },
    },
  });
  if (newMessage) {
    try {
      const pubsub = ablyLite();
      pubsub.publish(buildSubscriptionChannel(BigInt(body.convoId)), newMessage, SubEvents.MESSAGE);
    } catch (error) {
      console.error(error);
    }
    
    return res.status(200).json(newMessage);
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
