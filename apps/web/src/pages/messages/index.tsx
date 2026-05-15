// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/outline';
import Head from 'next/head';

import ConversationItem from 'components/ConversationList';
import Conversation from 'components/messages/Conversation';
import DirectMessageDrawer from 'components/messages/DirectMessageDrawer';
import useConversations from 'hooks/useConversations';
import { useScreen } from 'hooks/useAnalytics';
import { Screens } from 'lib/events';
import { Conversation as ConversationType } from 'types/prisma';

const Messages: React.VFC = () => {
  useScreen(Screens.Messages);
  const { conversations, actions, activeId } = useConversations();
  const hasActive = !!activeId;

  return (
    <div className="flex flex-row justify-start h-full w-full bg-backgroundNormal">
      <Head><title>Messages</title></Head>

      {/* Desktop: classic side-by-side drawer + conversation. The
          Drawer is hideOnMobile so it never bleeds into the mobile
          layout. */}
      <DirectMessageDrawer />

      {/* Mobile: show conversation list when nothing is active, the
          conversation thread (with a back arrow) when one is. */}
      <div className="flex sm:hidden w-full">
        {hasActive ? (
          <div className="flex flex-col h-full w-full">
            <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-dividerColor bg-backgroundDark/80 px-4 py-3 backdrop-blur">
              <button
                type="button"
                onClick={() => actions.deselectConversation()}
                className="p-1 rounded-full hover:bg-backgroundLight"
                aria-label="Back to conversations"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <span className="text-lg font-semibold">Conversation</span>
            </div>
            <div className="flex-1 min-h-0">
              <Conversation />
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full w-full">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-dividerColor bg-backgroundDark/80 px-4 py-3 backdrop-blur">
              <span className="text-lg font-semibold">Messages</span>
              <button
                type="button"
                onClick={actions.newConversation}
                className="rounded-full p-2 hover:bg-backgroundLight"
                aria-label="New conversation"
              >
                <PlusIcon className="w-5 h-5 text-primary" />
              </button>
            </div>
            {Object.values(conversations ?? {}).length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-fontTertiary">
                No conversations yet. Tap + to start one.
              </div>
            ) : (
              <div>
                {Object.values(conversations).map((convo) => (
                  <ConversationItem
                    key={`convo-${convo.id}`}
                    active={false}
                    conversation={convo as ConversationType}
                    handler={() => actions.changeConversation(convo.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop: standard conversation panel beside the drawer. */}
      <div className="hidden sm:flex w-full">
        <Conversation />
      </div>
    </div>
  );
};

export default Messages;
