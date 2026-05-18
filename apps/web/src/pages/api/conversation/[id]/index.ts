// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import HttpStatus from 'http-status-codes';

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

// DELETE /conversation/:id   Leave conversation (delete if all have left).
// DM "delete" semantics: the caller leaves the conversation. If they
// were the last member we tear down the row + its messages so we
// don't leak orphans. Other members keep their copy.
handler.delete(async (req: Rest<{ id: string }>, res) => {
  const me = await prisma.user.findUnique({
    where: { authId: req.authId },
    select: { id: true },
  });
  if (!me) return res.status(HttpStatus.NOT_FOUND).end();

  const convoId = BigInt(req.query.id);
  const convo = await prisma.conversation.findUnique({
    where: { id: convoId },
    select: { id: true, members: { select: { id: true } } },
  });
  if (!convo) return res.status(HttpStatus.NOT_FOUND).end();

  const isMember = convo.members.some((m) => m.id === me.id);
  if (!isMember) return res.status(HttpStatus.FORBIDDEN).end();

  await prisma.conversation.update({
    where: { id: convoId },
    data: { members: { disconnect: { id: me.id } } },
  });

  if (convo.members.length <= 1) {
    await prisma.directMessage.deleteMany({ where: { conversationId: convoId } });
    await prisma.conversation.delete({ where: { id: convoId } });
  }

  return res.status(HttpStatus.OK).json({ id: req.query.id });
});

export default handler;
