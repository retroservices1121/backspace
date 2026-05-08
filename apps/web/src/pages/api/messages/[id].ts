// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import prisma from 'api2/prisma';
import { buildChannelTopic, SubEvents } from 'lib/ably';
import { ablyLite } from 'lib/ablyServer';
import createHandler, { requireAuthMiddleware } from 'lib/nextconnect';
import { paginate } from 'lib/pagination';
import { Message } from 'types/prisma';
import { Edit, Paginate, Remove, Send } from 'types/requests/messages';

const handler = createHandler();

handler.use(requireAuthMiddleware);

// GET /messages/:channelId?lastId= (paginate)
handler.get(async (req: Paginate, res) => {
  const channelId = req.query.id;
  
  // TODO security: Is user part of said channel?
  // const authId = req.authId;
  // const res1 = await prisma.channel.findUnique({
  //   where: { id: BigInt(channelId) },
  //   select: { community: {
  //     select: { members: {
  //       where: { user: { authId } },
  //     } },
  //   } },
  // });

  const lastId = req.query.lastId;

  const messages = await prisma.message.findMany({
    ...paginate(lastId),
    where: { channelId: BigInt(channelId) },
    include: Message.include,
  });

  return res.json(messages);
});

// POST /messages/:channelId (send message)
handler.post(async (req: Send, res) => {
  const channelId = req.query.id;
  const { communityId, text } = req.body;

  const response = await prisma.message.create({
    data: {
      author:    { connect: { authId: req.authId } },
      channel: { connect: { uuid: channelId } },
      community: { connect: { uuid: communityId } },
      text: text,
    },
    include: Message.include,
  });

  // Fan out to subscribers of this channel so other members see the
  // message without polling. Failure to publish is non-fatal — the row
  // landed in Postgres, the sender's optimistic insert is correct, and
  // the next paginate will catch listeners back up.
  try {
    ablyLite().publish(buildChannelTopic(channelId), response, SubEvents.MESSAGE);
  } catch (err) {
    console.error('Ably publish failed for channel message', err);
  }

  return res.json(response);
});

// PATCH /messages/:messageId (edit message)
handler.patch(async (req: Edit, res) => {
  const messageId = req.query.id;
  const { text } = req.body;

  // TODO probably add security measures to prevent other people
  // from editing someone elses messages. So make sure to check authId.

  const response = await prisma.message.update({
    where: { uuid: messageId },
    data: { text },
    include: Message.include,
  });

  return res.json(response);
});

// DELETE /messages/:messageId (delete message)
handler.delete(async (req: Remove, res) => {
  const messageId = req.query.id;

  const response = await prisma.message.delete({
    where: { uuid: messageId },
    include: Message.include,
  });

  return res.json(response);
});

export default handler;