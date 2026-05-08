// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Chat Bubble

import React, { useState  } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { isFulfilled } from '@reduxjs/toolkit';
import { FilledIcon } from '@src/components/MediaPost/styled';
import { oldMessageListRemoveMe } from '@src/store/messageSlice';
import { useRouter } from 'next/router';

import type { MessageUnion as MessageType } from 'api/communityAPI';
import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
import RichRender from 'components/Rich/RichRender';
import { RootState, useAppDispatch } from 'store/store';
import { Space } from 'styles/layout';
import { timeString } from 'utils/common_utils';

import TrashIcon from 'public/graphics/commonicons/trash.svg';

import { ActionButton, Block, Content, DeleteButton, MessageMedia, Text, Time, Title  } from './styled';

type Props = {
  message: MessageType
};

/** @deprecated */
const Message: React.FC<Props> = ({ message }) => {
  const time : string = message?.timestamp ? timeString(message.timestamp.toDate()) : '';
  const router = useRouter();
  const [bigger, setBigger] = useState(false);
  const uid = useSelector((state : RootState) => state.user.id);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleted, setIsDeleted] = useState<boolean>(false);
  const dispatch = useAppDispatch();

  const actionDeletePost = async () => {
    setShowDeleteModal(false);
    const action = dispatch(oldMessageListRemoveMe(message));
    if (isFulfilled(action)) {
      setIsDeleted(true);
      toast.info('Message was successfully deleted!');
    } else {
      toast.error('Failed to be deleted.');
    }

  };

  const actionDidNotDeletePost = () => {
    setShowDeleteModal(false);
    toast.success('Message has not been deleted.');
  };


  if (isDeleted) return null;
  return (
    <Block className="rounded-xl py-3 px-2 my-2 w-full" key={`message-${message.id}`}>
      {/* Size is picked to match single line text height */}
      <Avatar type={AvatarTypes.Profile} size={54} circle image={message.author.avatar} />
      <Space />
      {/* <Avatar src={message.author.avatar || placeholderProfile} alt="user" /> */}
      <Content>
        <Title isSelf={message.sender === uid.toString()} onClick={() => message.author?.username && router.push(`/${message.author?.username}`)}>
          {message.author?.display_name}
          <Time>{time}</Time>
        </Title>
        <Text><RichRender value={message.text} /></Text>
        {message.media && message.mediaURL &&
          <MessageMedia
            bigger={bigger}
            exists={message.media ? true : false}
            src={message.mediaURL} onClick={() => setBigger(!bigger)}
            alt="media"
          />
        }
      </Content>
      <DeleteButton>
        {uid.toString() === message.author.id &&
      <ActionButton onClick={() => setShowDeleteModal(true)}>
        <FilledIcon $solid $color="error" as={TrashIcon} />
      </ActionButton>}
      </DeleteButton>

      {/* FIXME: Update comfirm modal
      <ModalV2 yesMessage="Delete Message" isOpen={showDeleteModal} onYes={actionDeletePost} onNo={actionDidNotDeletePost}/>
      <p>Are you sure you would like to delete this message?</p>
      </ModalV2/>
      */}
    </Block>
  );
};

export default Message;
