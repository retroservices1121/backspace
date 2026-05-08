// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import { useMemo } from 'react';
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
  // TODO when implemented, make required
  onEdit?: () => void;
};

const BaseMessage: React.VFC<Props> = ({
  message, author, onDelete,
}) => {
  const router = useRouter();
  const { user } = useUser();
  
  const time = useMemo(() => timeString(new Date(message.createdAt)), [message.createdAt]);
  
  const DeleteMessage = useRegisterModal(Modals.DeleteMessage);

  const handleDeleteMessage = () => {
    DeleteMessage.close();
    onDelete(message.id);
  };

  const isMessageAuthor = author.id === user.id;

  const avatar = useMedia(author.avatar as Media);

  return (
    <Block className="rounded-xl py-3 px-2 my-2 w-full" key={`message-${message.id}`}>
      {/* TODO hardcoded 54 seems a bit shit. Lets not do this. -sam */}
      {/* Size is picked to match single line text height */}
      <Avatar type={AvatarTypes.Profile} size={54} circle image={avatar} />
      <Space />
      {/* <Avatar src={message.author.avatar || placeholderProfile} alt="user" /> */}
      <Content>
        <Title isSelf={isMessageAuthor} onClick={() => router.push(`/${author.username}`)}>
          {author.username}
          <Time>{time}</Time>
        </Title>
        <Text><RichRender value={message.text} /></Text>
        {/* TODO Media */}
        {/* {message.media && message.mediaURL && (
          <MediaComponent url={message.mediaURL} />
        )} */}
      </Content>
      <DeleteButton>
        {isMessageAuthor &&
          <ActionButton onClick={DeleteMessage.open}>
            <FilledIcon $solid $color="error" as={TrashIcon} />
          </ActionButton>}
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
