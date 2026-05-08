// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Conversation, DirectMessage } from '@prisma/client';

export type SendMessageInput = {
  authorId: bigint, 
  convoId: bigint,
  text: string,
  media: File[]
};


export type ConversationsResponse = {
  conversation?: Conversation | null;
  conversations?: Conversation[] | null;
};

export type ConversationMessageResponse = {
  message: DirectMessage
};