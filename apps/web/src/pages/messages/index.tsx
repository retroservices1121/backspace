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
    <div className="flex flex-row justify-start h-full w-full bg-canvas font-display text-ink">
      <Head><title>Messages</title></Head>

      {/* Desktop: 2-column layout — DM list sidebar + conversation
          pane. Mobile branch below renders one or the other. */}
      <DirectMessageDrawer />

      <div className="flex sm:hidden w-full">
        {hasActive ? (
          <div className="flex flex-col h-full w-full">
            <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-line bg-canvas/[0.78] px-5 py-3 backdrop-blur-[14px] backdrop-saturate-[160%]">
              <button
                type="button"
                onClick={() => actions.deselectConversation()}
                className="w-9 h-9 rounded-full flex items-center justify-center text-ink-2 hover:bg-hover hover:text-ink transition-colors"
                aria-label="Back to conversations"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <span className="text-[18px] font-semibold text-ink">Conversation</span>
            </div>
            <div className="flex-1 min-h-0">
              <Conversation />
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full w-full">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-canvas/[0.78] px-5 py-3 backdrop-blur-[14px] backdrop-saturate-[160%]">
              <span className="text-[18px] font-semibold text-ink">Messages</span>
              <button
                type="button"
                onClick={actions.newConversation}
                className="w-9 h-9 rounded-full flex items-center justify-center text-brand-2 hover:bg-brand-soft transition-colors"
                aria-label="New conversation"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
            {Object.values(conversations ?? {}).length === 0 ? (
              <div className="px-5 py-12 text-center text-[13px] text-ink-3">
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
                    onDelete={actions.removeConversation}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop conversation pane sits next to the new DirectMessageDrawer
          sidebar. */}
      <div className="hidden sm:flex w-full">
        <Conversation />
      </div>
    </div>
  );
};

export default Messages;
