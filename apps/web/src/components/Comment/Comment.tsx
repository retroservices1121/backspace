// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import { FieldValue, Timestamp } from '@google-cloud/firestore';
import useMedia from '@src/hooks/useMedia';
import { Comment } from '@src/types/prisma';

import { CommentUnion } from 'api/PostAPI';
import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
import RichRender from 'components/Rich/RichRender';
import { Col, OldCol, OldRow, Row } from 'styles/Flex';
import { Space } from 'styles/layout';
import { timeAgoStringAbbreviation } from 'utils/common_utils';

import { DisplayName, TimeContainer } from './styled';

const commentTime = (creation: Date ) => {
  // const date = new Date(creation);
  const timeAgo = timeAgoStringAbbreviation(new Date(creation));
  return timeAgo;
};

type Props = {
  comment: Comment
};

const DisplayComment: React.FC<Props> = ({ comment }) => {
  const avatar = useMedia(comment?.author?.avatar);
  return (
    <Row $full>
      <Avatar
        circle
        image={avatar}
        size={40}
        type={AvatarTypes.Profile}
      />
      <Space direction='row' size='sm' />
      <Col>
        <div>
        <Row>
          <DisplayName>{comment?.author?.name || `@${comment?.author?.username}`}</DisplayName>
          <TimeContainer>{commentTime(comment.createdAt)}</TimeContainer>
        </Row>
        <RichRender value={comment.text} />
        </div>
      </Col>
    </Row>
  );
};

export default DisplayComment;
