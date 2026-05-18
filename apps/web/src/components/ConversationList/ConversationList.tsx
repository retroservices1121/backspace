// // Copyright 2021 NewSocial Inc.
// // Author(s): Dylan Trafford
// // Description: Displays user image and username for list

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { TrashIcon } from '@heroicons/react/outline';

import { mediaToURLCallback } from 'api2/storage';
import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
import SmartContent from 'components/SmartContent';
import { RootState } from 'store/store';
import { OldCol, OldRow } from 'styles/Flex';
import { Space } from 'styles/layout';
import { Conversation } from 'types/prisma';

import { Block, Description, Title } from './styled';

type Props = {
  conversation: Conversation;
  active: boolean;
  handler: () => void;
  onDelete?: (conversationId: bigint) => void | Promise<void>;
};


const ConversationList: React.FC<Props> = ({ conversation, active,  handler, onDelete }) => {
  const [readCount, setReadCount] = useState(0);
  const { id } = useSelector((state: RootState) => state.user);
  const [convoAvatar, setConvoAvatar] = useState<string>(undefined);
  const [convoName, setConvoName] = useState<string>(conversation.name || '[Unnamed Convo]');
  const [description, setDescription] = useState<string>('');
  const [confirming, setConfirming] = useState(false);
  
  //Get the first conversation member that isn't me
  // TODO update for mulitple members
  useEffect(() => {
    if (conversation.members?.length > 0) {
      setDescription(`${conversation.members.map((mem) => `@${mem.username}`)}`);
      const firstUser = conversation.members.find((mem) => mem.id != id);
      if (firstUser) {
        if (!conversation.name) {
          if (conversation.members?.length > 2) {
            setConvoName('Group Chat');
          } else {
            setConvoName(firstUser.name || firstUser.username);  
          }
          
        }
        mediaToURLCallback(firstUser.avatar, setConvoAvatar);
      } else {
        setConvoAvatar(undefined);
      } 
    } else {
      setConvoAvatar(undefined);
      setDescription('');
      setConvoName('[New Conversation]');
    }
  }, [conversation]);


  function trimDescription(initial: string, length: number = 25) {
    if (initial && initial.length > length) {
      return `${description.slice(0, length)}...`;
    } else {
      return '';
    }
  }

  // getReadCount(conversation).then((count : number) => setReadCount(count));

  // const calculateUnread = (total: number | undefined, read : number | undefined) => {
  //   if (!total || !read) return 0;
  //   else {
  //     return total - read;
  //   }
  // };
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirming(true);
  };

  const handleConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirming(false);
    if (onDelete) await onDelete(conversation.id);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirming(false);
  };

  return (
    <Block active={active} onClick={handler} className="group relative">
      <OldRow $full>
        <Avatar size={48} type={AvatarTypes.Profile} image={convoAvatar} circle />
        <Space />
        <OldCol $full>
          <OldRow $full>
            <Title>{convoName || '[New Conversation]'}</Title>
            {/* <Time active={active}>{timeCompactString((conversation. as Timestamp)?.toDate())}</Time> */}
          </OldRow>
          <SmartContent clickable={false}>
            <OldRow>
              <Description active={active}>{trimDescription(description)}</Description>
            </OldRow>
          </SmartContent>
        </OldCol>
        {onDelete && !confirming && (
          <button
            type="button"
            onClick={handleDeleteClick}
            aria-label="Delete conversation"
            className="
              ml-2 w-8 h-8 rounded-full flex items-center justify-center
              text-ink-3 hover:text-pink-vivid hover:bg-hover
              opacity-0 group-hover:opacity-100 focus:opacity-100
              transition-opacity duration-150
            "
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
        {onDelete && confirming && (
          <div className="ml-2 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={handleConfirm}
              className="
                rounded-full px-2.5 h-7 text-[11px] font-semibold
                bg-pink-vivid text-ink hover:opacity-90
                transition-opacity
              "
            >
              Delete
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="
                rounded-full px-2.5 h-7 text-[11px] font-medium
                text-ink-2 hover:bg-hover hover:text-ink
                transition-colors
              "
            >
              Cancel
            </button>
          </div>
        )}
      </OldRow>
    </Block>
  );
};

export default ConversationList;
