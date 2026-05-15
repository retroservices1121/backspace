// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History
//
// Shared message row used by both DM threads (components/messages/
// Conversation) and community channel messages (Community/Message/
// ChannelMessage). Renders edit (inline textarea) + delete (confirm
// modal) author-only.

import React, { useMemo, useState } from 'react';
import { PencilIcon } from '@heroicons/react/outline';
import { Media } from '@prisma/client';
import { useRouter } from 'next/router';

import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
import { FilledIcon } from 'components/MediaPost/styled';
import { ActionButton, Block, Content, DeleteButton, Text, Time, Title } from 'components/Message/styled';
import RichRender from 'components/Rich/RichRender';
import useMedia from 'hooks/useMedia';
import useUser from 'hooks/useUser';
import { useRegisterModal } from 'lib/Modal';
import { Space } from 'styles/layout';
import { User } from 'types/prisma';
import { timeString } from 'utils/common_utils';
import { Modals } from 'utils/constants';

import TrashIcon from 'public/graphics/commonicons/trash.svg';

type Props = {
  // This is meant to be a loose interface. In theory it should work for both Message & DirectMessage
  message: {
    id: bigint;
    createdAt: Date;
    text: string;
  }
  author: User
  onDelete: (id: bigint) => void;
  // Called with the new text once the author finishes inline editing.
  onEdit?: (text: string) => void;
};

const BaseMessage: React.VFC<Props> = ({
  message, author, onDelete, onEdit,
}) => {
  const router = useRouter();
  const { user } = useUser();

  const time = useMemo(() => timeString(new Date(message.createdAt)), [message.createdAt]);

  const DeleteMessage = useRegisterModal(Modals.DeleteMessage);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);

  const handleDeleteMessage = () => {
    DeleteMessage.close();
    onDelete(message.id);
  };

  const startEditing = () => {
    setDraft(message.text);
    setEditing(true);
  };

  const saveEdit = () => {
    const next = draft.trim();
    if (!next || next === message.text) {
      setEditing(false);
      return;
    }
    onEdit?.(next);
    setEditing(false);
  };

  const cancelEdit = () => {
    setDraft(message.text);
    setEditing(false);
  };

  const isMessageAuthor = author.id === user.id;
  const canEdit = isMessageAuthor && !!onEdit;

  const avatar = useMedia(author.avatar as Media);

  return (
    <Block className="rounded-xl py-3 px-2 my-2 w-full" key={`message-${message.id}`}>
      {/* TODO hardcoded 54 seems a bit shit. Lets not do this. -sam */}
      {/* Size is picked to match single line text height */}
      <Avatar type={AvatarTypes.Profile} size={54} circle image={avatar} />
      <Space />
      <Content>
        <Title isSelf={isMessageAuthor} onClick={() => router.push(`/${author.username}`)}>
          {author.username}
          <Time>{time}</Time>
        </Title>
        {editing ? (
          <div className="w-full">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelEdit();
                } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  saveEdit();
                }
              }}
              autoFocus
              className="w-full rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-sm text-white focus:border-white/30 focus:outline-none"
              rows={Math.min(6, Math.max(2, draft.split('\n').length))}
            />
            <div className="mt-1 flex gap-2 text-xs">
              <button
                type="button"
                onClick={saveEdit}
                className="rounded-md bg-white/10 px-2 py-0.5 text-white hover:bg-white/20"
              >
                Save
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-md px-2 py-0.5 text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <span className="ml-auto text-white/40">⌘+Enter to save · Esc to cancel</span>
            </div>
          </div>
        ) : (
          <Text><RichRender value={message.text} /></Text>
        )}
        {/* TODO Media */}
      </Content>
      <DeleteButton>
        {!editing && canEdit && (
          <ActionButton onClick={startEditing} aria-label="Edit message">
            <PencilIcon className="w-5 h-5" />
          </ActionButton>
        )}
        {!editing && isMessageAuthor && (
          <ActionButton onClick={DeleteMessage.open} aria-label="Delete message">
            <FilledIcon $solid $color="error" as={TrashIcon} />
          </ActionButton>
        )}
      </DeleteButton>

      <DeleteMessage>
        <div>
          <p>Are you sure you would like to delete this message?</p>
          <button onClick={handleDeleteMessage}>yes</button>
          <button onClick={DeleteMessage.close}>no</button>
        </div>
      </DeleteMessage>
    </Block>
  );
};

export default BaseMessage;
