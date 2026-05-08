/* eslint-disable @typescript-eslint/no-use-before-define */
// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import * as Types from '@prisma/client';
import { DirectMessage, Prisma } from '@prisma/client';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from '@src/lib/axios';

import type { MessageUnion } from 'types/legacy-aliases';
import ApiClient from 'lib/apiClient';
import { MESSAGES_PER_FETCH } from 'lib/pagination';
import { Conversation } from 'types/prisma';
import { sortByCreatedAt } from 'utils/sorting';

import { RootState } from './store';
import { fetchUser } from './userSlice';

const NAMESPACE = 'message';

let unsubDms = () => { };

/** Prefer this over directly calling unsubDms, that way we can know it was called */
export const unsubscribeConversations = createAsyncThunk(
  `${NAMESPACE}/unsubscribeConversations`,
  async () => unsubDms(),
);

// TODO remove this
export const oldMessageListRemoveMe = createAsyncThunk(
  `${NAMESPACE}/deleteMesage`, (message: MessageUnion) => {},
);



// Realtime DM subscription previously used Supabase realtime; that path is dead
// (see commented-out dispatch in changeConversation). Realtime is now Ably.
// Stub kept as no-op so any phantom imports do not break.
export const subscribeMessages = createAsyncThunk(
  `${NAMESPACE}/subscribeMessages`,
  async (_conversationId: bigint) => null,
);

const paginateMessages = createAsyncThunk(
  `${NAMESPACE}/paginateMessages`,
  async (_, { dispatch, getState }) => {
    const { message: { conversations, activeConversation } } = getState() as RootState;
    const { id, lastId } = conversations[activeConversation.toString()];
    if (!id) throw new Error('Attempted to paginate without a selected conversation');

    const { data, status } = await ApiClient.Conversation.getMessages(id, lastId);
    if (status === 200) {
      dispatch(messageActions.upsertMessages({
        id, messages: data.messages,
      }));
    }
  },
);

const sendMessage = createAsyncThunk(
  `${NAMESPACE}/sendMessage`,
  async ({ text, media }: { text: string, media?: File }, { dispatch, getState }) => {
    const { user, message: { activeConversation, conversations } } = getState() as RootState;
    const convo = conversations[activeConversation.toString()];

    const { status, data } = await ApiClient.Conversation.sendMessage({
      media: [media],
      text,
      authorId: user.id,
      convoId: convo.id,
    });

    if (status === 200) {
      dispatch(messageActions.upsertMessages({
        id: convo.id,
        messages: [data],
      }));
    }
  },
);

const changeConversation = createAsyncThunk(
  `${NAMESPACE}/changeConversation`,
  async (id: bigint, { dispatch, getState }) => {
    const { message: { conversations } } = getState() as RootState;
    const convo = conversations[id.toString()];
    dispatch(messageActions.setActiveConversation(convo.id));
    // dispatch(subscribeMessages(convo.id));
    dispatch(messageActions.paginateMessages());
  },
); 

const addUserToConversation = createAsyncThunk<void, string>(
  `${NAMESPACE}/addUserToConversation`,
  async (username, { dispatch, getState }) => {
    const { user, message } = getState() as RootState;
    const result = await axios().put(`conversation/${message.activeConversation}/member`, { username: username });
    dispatch(fetchUser(user.authId));
    return; 
  },
);

// TODO Marked in bs-596
const removeUserFromConversation = createAsyncThunk<void, bigint>(
  `${NAMESPACE}/removeUserFromConversation`,
  async (userId, { dispatch, getState }) => {
    const { user, message } = getState() as RootState;
    //@ts-ignore FIXME (bad delete use)
    const result = await axios.delete(`/api/conversation?id=${message.activeConversation}`, { userId });
    dispatch(fetchUser(user.authId));
    return; 
  },
);

const newConversation = createAsyncThunk(
  `${NAMESPACE}/newConversation`,
  async (_, { dispatch, getState }) => {
    const { user } = getState() as RootState;
    const { status, data } = await ApiClient.Conversation.create(user.id);
    if (status === 200) {
      dispatch(messageActions.changeConversation(data));
      dispatch(messageActions.upsertConversations([data]));
    }
  },
);

type ConversationState = Conversation & {
  lastId: bigint;
  canPaginate: boolean;
  messages: Types.DirectMessage[];
};

const initialConversationState: Partial<ConversationState> = {
  lastId: null,
  canPaginate: true,
  messages: [],
};


type MessageState = {
  conversations: Record<string, ConversationState>;
  activeConversation: bigint;
};

const initialState : MessageState = {
  activeConversation: null,
  conversations: {},
};

export const directMessageSlice = createSlice({
  name: NAMESPACE,
  initialState,
  reducers: {
    upsertConversations(state, { payload }: PayloadAction<Omit<Conversation, 'messages'>[]>) {
      for (const dm of payload) {
        const id = dm.id.toString();
        state.conversations[id] = {
          ...initialConversationState,
          ...state.conversations[id],
          ...dm,
        };
      }
      if (state.activeConversation === null && payload[0]) {
        state.activeConversation = payload[0].id;
      }
    },
    upsertMessages(state, { payload: { id, messages } }: PayloadAction<{ id: bigint; messages: DirectMessage[] }>) {
      const conversation = state.conversations[id.toString()];
      if (messages.length < MESSAGES_PER_FETCH) {
        conversation.canPaginate = false;
      }

      // No duplicates. Can probably be done better/cleaner
      for (const msg of messages) {
        if (conversation.messages.findIndex(m => m.id === msg.id) === -1) {
          conversation.messages.push(msg);
        }
      }
      conversation.messages.sort(sortByCreatedAt());
      
      // If len is 0, we still want to keep track of lastId
      conversation.lastId = messages[messages.length - 1]?.id || conversation.lastId;
    },
    deleteMessage(state, { payload }: PayloadAction<DirectMessage>) {
      const convo = state.conversations[state.activeConversation.toString()];
      convo.messages = convo.messages.filter(m => m.id !== payload.id);
    },
    setActiveConversation: (state, { payload }: PayloadAction<bigint>) => {
      state.activeConversation = payload;
    },
  },
  extraReducers: () => { /* subscribeMessages is a stub; no state mutation */ },
});

export default directMessageSlice.reducer;
export const messageActions = {
  ...directMessageSlice.actions,
  addUserToConversation,
  changeConversation,
  newConversation,
  paginateMessages,
  removeUserFromConversation,
  sendMessage,
};
