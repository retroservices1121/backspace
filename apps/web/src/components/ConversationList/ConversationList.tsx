// // Copyright 2021 NewSocial Inc.
// // Author(s): Dylan Trafford
// // Description: Displays user image and username for list

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

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
};


const ConversationList: React.FC<Props> = ({ conversation, active,  handler }) => {
  const [readCount, setReadCount] = useState(0);
  const { id } = useSelector((state: RootState) => state.user);
  const [convoAvatar, setConvoAvatar] = useState<string>(undefined);
  const [convoName, setConvoName] = useState<string>(conversation.name || '[Unnamed Convo]');
  const [description, setDescription] = useState<string>('');
  
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
  return (
    <Block active={active} onClick={handler}>
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
              {
                // calculateUnread(conversation.message_count, readCount) > 0 && !active &&
                // <UnreadCount>{calculateUnread(conversation.message_count, readCount)}</UnreadCount>
              }
            </OldRow>
          </SmartContent>
        </OldCol>
      </OldRow>
    </Block>
  );
};

export default ConversationList;
