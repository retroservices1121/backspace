// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { DirectMessage } from '@prisma/client';

import axios from 'lib/axios';
import { Conversation as IConversation, Message } from 'types/prisma';
import { SendMessageInput } from 'types/requests/conversation';

// Mapping the REST endpoints here because fuck if its confusing with file based api routing

// GET    /conversation/              Get all user conversations
// POST   /conversation/              Create conversation
// PATCH  /conversation/:id           Update conversation

// GET    /conversation/:id?lastId    Get messages
// POST   /conversation/:id           Send message
// PATCH  /conversation/:id/:msgId    Edit message
// DELETE /conversation/:id/:msgId    Delete message

const Conversation = (route: string) => ({
  // getAll() {},
  create(userId: bigint) {
    return axios().post(`${route}/`, { userId });
  },
  // edit() {},
  // leave() {},

  /** Includes pagination logic */
  getMessages(conversationId: bigint, lastId?: bigint) {
    const query = new URLSearchParams();
    if (lastId) query.append('lastId', lastId.toString());

    return axios().get<IConversation>(`${route}/${conversationId}?${query}`);
  },

  sendMessage(data: SendMessageInput) {
    return axios().post<DirectMessage>(`${route}/${data.convoId}`, data);
  },

  // editMessage() {},
  deleteMessage(convoId: bigint, id: bigint) {
    return axios().delete<DirectMessage>(`${route}/${convoId}/${id}`);
  },
});

export default Conversation;
