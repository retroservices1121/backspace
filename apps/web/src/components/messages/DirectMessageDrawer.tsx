// Desktop DM sidebar — list of conversations + a New conversation
// CTA at the top. Hidden on mobile; the mobile branch in
// messages/index.tsx renders the same conversation rows inline
// with an X-style sticky back-arrow header.

import { PlusIcon } from '@heroicons/react/outline';
import Loading from 'react-loading';
import useConversations from '@src/hooks/useConversations';

import ConversationItem from 'components/ConversationList';
import constants from 'styles/Globals';
import { Conversation } from 'types/prisma';

export default function DirectMessageDrawer() {
  const { conversations, actions, activeId } = useConversations();

  const handleConversationClick = (id: bigint) => () => {
    actions.changeConversation(id);
    if (typeof window !== 'undefined'
      && window.innerWidth <= parseInt(constants.SMALLSCREEN_WIDTH, 10)) {
      actions.toggleDrawer();
    }
  };

  return (
    <aside
      className="
        hidden sm:flex flex-col flex-none
        w-[320px] h-screen
        border-r border-line bg-canvas
        font-display text-ink
      "
    >
      <div
        className="
          sticky top-0 z-10
          px-5 py-3.5
          border-b border-line
          bg-canvas/[0.78]
          backdrop-blur-[14px] backdrop-saturate-[160%]
          flex items-center justify-between
        "
      >
        <h2 className="m-0 text-[18px] font-bold tracking-[-0.02em] text-ink">
          Messages
        </h2>
        <button
          type="button"
          onClick={actions.newConversation}
          className="
            w-9 h-9 rounded-full flex items-center justify-center
            text-brand-2 hover:bg-brand-soft transition-colors
          "
          aria-label="New conversation"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!conversations && (
          <div className="flex justify-center py-6">
            <Loading type="spinningBubbles" color="#7B4CFF" height={32} width={32} />
          </div>
        )}
        {conversations && Object.values(conversations).length === 0 && (
          <div className="px-5 py-10 text-center text-[13px] text-ink-3">
            No conversations yet. Tap + to start one.
          </div>
        )}
        {Object.values(conversations)?.map((convo) => (
          <ConversationItem
            key={`convo-${convo.id}`}
            active={activeId === convo.id}
            conversation={convo as Conversation}
            handler={handleConversationClick(convo.id)}
          />
        ))}
      </div>
    </aside>
  );
}
