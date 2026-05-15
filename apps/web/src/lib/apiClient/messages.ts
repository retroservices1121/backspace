// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Message } from 'types/prisma';
import { Send } from 'types/requests/messages';

import axios from '../axios';

const Messages = (route: string) => ({
  send(channelId: string, data: Send['body']) {
    // TODO idk what this is gonna return
    return axios().post<Message>(`${route}/${channelId}`, data);
  },

  edit(messageId: string, body: { text: string }) {
    return axios().patch<Message>(`${route}/${messageId}`, body);
  },

  delete(messageId: string) {
    return axios().delete(`${route}/${messageId}`);
  },

  paginate(channelId: bigint, lastId?: bigint) {
    const query = new URLSearchParams();
    if (lastId) query.append('lastId', lastId.toString());

    return axios().get<Message[]>(`${route}/${channelId}?${query}`);
  },
});

export default Messages;
