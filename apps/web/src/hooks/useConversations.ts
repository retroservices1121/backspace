// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { buildSubscriptionChannel } from 'lib/ably';
import ApiClient from 'lib/apiClient';
import { toggleDrawer } from 'store/appSlice';
import {
  selectActive,
  selectConversations,
} from 'store/message/selectors';
import { messageActions } from 'store/messageSlice';
import { useAppDispatch } from 'store/store';
import { selectUserConversations } from 'store/user/selectors';
import { usersActions } from 'store/usersSlice';

import useAsyncEffect from './useAsyncHook';
import { usePubSub } from './usePubSub';


/** Scoped to Dms/conversations/"messages" (we need to pick one of the names) feature */
export default function useConversations() {
  const dispatch = useAppDispatch();
  const userConversations = useSelector(selectUserConversations);

  useEffect(() => {
    if (userConversations.length !== 0) {
      // TODO remove conversations from user slice, since its not needed there. (we can then drop this line)
      dispatch(messageActions.upsertConversations(userConversations));
      // Insert users from convos into the user cache to be able to access them from useUserById
      dispatch(usersActions.upsertUsers(
        userConversations.flatMap(convo => convo.members),
      ));

      // Paginate relies on data set by upsertConversations
      dispatch(messageActions.paginateMessages());
    }
  }, [userConversations]);

  const conversations = useSelector(selectConversations);
  const conversation = useSelector(selectActive);

  return {
    conversations,
    activeId: conversation?.id,
    actions: {
      changeConversation(conversationId: bigint) {
        dispatch(messageActions.changeConversation(conversationId));
      },
      newConversation() {
        dispatch(messageActions.newConversation());
      },
      toggleDrawer,
    },
  };
}

/** Scoped to single conversation/chat (chat to avoid confusion) */
export function useChat() {
  const conversation = useSelector(selectActive);
  const dispatch = useAppDispatch();
  const pubsub = usePubSub();


  useAsyncEffect([conversation?.id], async () => {
    if (conversation?.id) {
      const channel = buildSubscriptionChannel(conversation.id);
      console.debug(`subscribing to ${channel}`);
      pubsub.subscribe(channel, (msg) => {
        dispatch(messageActions.upsertMessages({
          id: conversation.id,
          messages: [msg?.data],
        }));

        console.debug('message in ', msg);
      });
    } 
    
  });

  const deleteMessage = useCallback(
    async (id: bigint) => {
      const { status, data } = await ApiClient.Conversation.deleteMessage(conversation.id, id);
      if (status === 200) dispatch(messageActions.deleteMessage(data));
    },
    [conversation],
  );

  const editMessage = useCallback(
    async (id: bigint, text: string) => {
      const { status, data } = await ApiClient.Conversation.editMessage(
        conversation.id,
        id,
        text,
      );
      if (status === 200) dispatch(messageActions.editMessage(data));
    },
    [conversation],
  );

  return {
    conversation,
    paginate() {
      dispatch(messageActions.paginateMessages());
    },

    sendMessage(text: string, media?: File) {
      dispatch(messageActions.sendMessage({ text, media }));
    },

    deleteMessage,
    editMessage,
  };
}
