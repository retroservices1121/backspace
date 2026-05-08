/* eslint-disable @typescript-eslint/no-use-before-define */
// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { orderBy } from 'firebase/firestore';

import { MessageUnion } from 'api/communityAPI';
import { ConversationUnion, newConversation, subscribeMessages } from 'api/DirectMessageAPI';
import { deleteMessage as removeMessage } from 'api/DirectMessageAPI';
import { getAvatar, getUserById } from 'api/userAPI';
import { ConversationDocument } from 'shared/types/documents';

import { FireDB, paths } from '../api/firebase';
import { RootState } from './store';

const NAMESPACE = 'directMessage';

let unsubDms = () => { };

/** Prefer this over directly calling unsubDms, that way we can know it was called */
export const unsubscribeConversations = createAsyncThunk(
  `${NAMESPACE}/unsubscribeConversations`,
  async () => unsubDms(),
);

export const deleteMessage = createAsyncThunk(
  `${NAMESPACE}/deleteMesage`,
  (message: MessageUnion) => {
    return removeMessage(message);
    //return message.id;
  },
);



/** Subscribes to firestore conversations and dispatches actions when we receive a new snapshot */
export const subscribeConversations = createAsyncThunk<void, void>(
  `${NAMESPACE}/subscribeConversations`,
  async (_, thunkAPI) => {
    const { user } = thunkAPI.getState() as RootState;
    const conversationsTable = new FireDB<ConversationDocument>(paths.dms(user.id));
    const query = [orderBy('last_update', 'desc')];

    unsubDms();
    unsubDms = await conversationsTable.subscribeQuery(query, async conversations => {
      const conversationsUnion: ConversationUnion[] = [];
      for (let value of conversations) {
        const other = await getUserById(value.other_uid);
        if (other) {
          other.avatar = await getAvatar(other?.profile_image);
          conversationsUnion.push({
            ...value,
            other: other,
          });
        }
      }
      // eslint-disable-next-line
      thunkAPI.dispatch(setConversations(conversationsUnion));
    });
  },
);

export const changeConversation = createAsyncThunk(
  `${NAMESPACE}/changeConversation`,
  async (convo : ConversationDocument, thunkAPI) => {
    thunkAPI.dispatch(setActiveConversation(convo));
    thunkAPI.dispatch(setActiveMessages([])); //Clear current messages
    thunkAPI.dispatch(setMoreMessages([]));
    subscribeMessages(convo, (result) => {
      thunkAPI.dispatch(setActiveMessages(result));
    });
    thunkAPI.dispatch(setHasMoreMessages(true));
  },
); 

/** sets conversation based on uid */
export const setConversationFromUid = createAsyncThunk(
  `${NAMESPACE}/setConversationFromUid`,
  async (uid: string, thunkAPI) => {
    const { directMessage, user } = thunkAPI.getState() as RootState;
    let found = directMessage.conversations.find((convo) => convo.other_uid === uid);
    console.log(found);
    if (!found) {
      await newConversation(user.id, uid);
      found = directMessage.conversations.find((convo) => convo.other_uid === uid);
    } 
    if (found) {
      thunkAPI.dispatch(changeConversation(found));
    }
  },
);

type DirectMessageState = {
  conversations: Array<ConversationUnion>,
  activeConversation: ConversationUnion,
  activeMessages: Array<MessageUnion>,
  hasMoreMessages: boolean,
  moreMessages: Array<MessageUnion>,
  activeUnsubscribe: any,
};

const initialState : DirectMessageState = {
  conversations: [],
  activeConversation: <ConversationUnion>{},
  activeMessages: [],
  hasMoreMessages: false,
  moreMessages: [],
  activeUnsubscribe: () => {},
};

export const directMessageSlice = createSlice({
  name: NAMESPACE,
  initialState,
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },
    setActiveMessages: (state, action) => {
      state.activeMessages = action.payload;
    },
    setHasMoreMessages: (state, action) => {
      state.hasMoreMessages = action.payload;
    },
    setMoreMessages: (state, action) => {
      state.moreMessages = action.payload;
    },
  },
  // extraReducers: (builder) => {
  //   builder.addCase(processNewMessages.fulfilled, (state, action) => {
  //     _.unionBy(updatingArr, origArr, 'name');
  //     state.activeMessages = action.payload;
  //   });
  // },
});

// Action creators are generated for each case reducer function
export const { setConversations, setActiveConversation, setActiveMessages, setHasMoreMessages, setMoreMessages } = directMessageSlice.actions;

export default directMessageSlice.reducer;
