// // Copyright 2021 NewSocial Inc.
// // Author(s): Dylan Trafford
// // Description: Displays user image and username for list

import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';

import { ConversationUnion, getReadCount } from 'api/DirectMessageAPI';
import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
import SmartContent from 'components/SmartContent';
import { timeCompactString } from 'shared/common_utils';
import { Col, Row } from 'styles/Flex';
import { Space } from 'styles/layout';

import { Block, Time, Title, UnreadCount } from './styled';

type Props = {
  conversation: ConversationUnion;
  active: boolean;
  handler: () => void;
};


const ConversationList: React.FC<Props> = ({ conversation, active,  handler }) => {
  const [readCount, setReadCount] = useState(0);


  let description = conversation.last_message?.text;
  if (description && description.length > 25) {
    description = `${description.slice(0, 25)}...`;
  }

  getReadCount(conversation).then((count : number) => setReadCount(count));

  const calculateUnread = (total: number | undefined, read : number | undefined) => {
    if (!total || !read) return 0;
    else {
      return total - read;
    }
  };

  return (
    <Block active={active} onClick={handler}>
      <Row $full>
        <Avatar size={48} type={AvatarTypes.User} image={conversation.other.avatar} circle online={conversation.other.online} />
        <Space />
        <Col $full>
          <Row $full>
            <Title>{conversation.other.display_name || 'Backspacer'}</Title>
            <Time active={active}>{timeCompactString((conversation.last_update as Timestamp)?.toDate())}</Time>
          </Row>
          <SmartContent clickable={false}>
            <Row>
              {/* <Description active={active}>{description}</Description> */}
              {
                calculateUnread(conversation.message_count, readCount) > 0 && !active &&
                <UnreadCount>{calculateUnread(conversation.message_count, readCount)}</UnreadCount>
              }
            </Row>
          </SmartContent>
        </Col>
      </Row>
    </Block>
  );
};

export default ConversationList;