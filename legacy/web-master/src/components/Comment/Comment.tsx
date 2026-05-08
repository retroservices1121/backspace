// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import { FieldValue, Timestamp } from '@google-cloud/firestore';

import { CommentUnion } from 'api/PostAPI';
import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
import RichRender from 'components/Rich/RichRender';
import { useBlocked } from 'hooks/useBlocked';
import { timeAgoStringAbbreviation } from 'shared/common_utils';
import { Col, Row } from 'styles/Flex';
import { Space } from 'styles/layout';

import { DisplayName, TimeContainer } from './styled';

const commentTime = (creation: Timestamp | FieldValue ) => {
  const time = creation as Timestamp;
  return timeAgoStringAbbreviation(time.toDate());
};

type Props = {
  comment: CommentUnion
};

const Comment: React.FC<Props> = ({ comment }) => {
  const { blocked } = useBlocked(comment.sender);
  return (
    <Row $full>
      <Avatar
        circle
        image={comment.author.avatar}
        size={40}
        type={AvatarTypes.Profile}
      />
      <Space direction='row' size='sm' />
      <Col className='w-full overflow-x-hidden'>
        <Row>
          <DisplayName>{comment.author?.display_name || `@${comment.author.username}`}</DisplayName>
          <TimeContainer>{commentTime(comment.timestamp)}</TimeContainer>
        </Row>
        {blocked 
          ? <h6><span className='text-primary'>Content hidden. User is blocked.</span></h6>
          : <RichRender value={comment.text} />
        }
      </Col>
    </Row>
  );
};

export default Comment;