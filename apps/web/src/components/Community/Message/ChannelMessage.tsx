// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';

import useMessage from 'hooks/entities/useMessage';
import { useUserById } from 'hooks/useUser';
import { Message as MessageType } from 'types/prisma';

import BaseMessage from './BaseMessage';

type Props = { message: MessageType };

const ChannelMessage: React.FC<Props> = ({ message }) => {
  const author = useUserById(message.author.uuid);
  const { Delete, edit } = useMessage(message.uuid);

  return (
    <BaseMessage
      message={message}
      author={author}
      onDelete={Delete}
    />
  );
};

export default ChannelMessage;
