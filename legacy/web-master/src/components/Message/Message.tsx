// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Chat Bubble

import React, { useState  } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { isFulfilled } from '@reduxjs/toolkit';

import { MessageUnion as MessageType } from 'api/communityAPI';
import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
import { FilledIcon } from 'components/MediaPost/styled';
import Confirm from 'components/Modal/Confirm';
import RichRender from 'components/Rich/RichRender';
// import { ReactComponent as EyeOff } from 'graphics/commonicons/eyeoff.svg';
import { ReactComponent as TrashIcon } from 'graphics/commonicons/trash.svg';
import { useBlocked } from 'hooks/useBlocked';
import { timeString } from 'shared/common_utils';
// import { useModal } from 'lib/Modal';
import { PermissionsType } from 'shared/types/documents';
import { deleteMessage } from 'store/directMessageSlice';
import { selectRole } from 'store/selectors';
import { RootState } from 'store/store';
import { Space } from 'styles/layout';

// import { BanModalProps, Modals } from 'util/constants';
import { ActionButton, ActionButtons, Block, Content, Media, Text, Time, Title  } from './styled';

type Props = {
  message: MessageType
};

const Message: React.FC<Props> = ({ message }) => {
  const time : string = message?.timestamp ? timeString(message.timestamp.toDate()) : '';
  const history = useHistory();
  const [bigger, setBigger] = useState(false);
  const uid = useSelector((state : RootState) => state.user.id);
  const role = useSelector(selectRole);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleted, setIsDeleted] = useState<boolean>(false);
  const dispatch = useDispatch();

  const { blocked } = useBlocked(message.sender);

  const actionDeletePost = async () => {
    setShowDeleteModal(false);
    const action = await dispatch(deleteMessage(message));
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

  const isMod = role >= PermissionsType.Moderators;
  const canDelete = uid === message.author.id || isMod;

  // const BanModal = useRegisterModal(Modals.BanModal);

  // const banModal = useModal<BanModalProps>(Modals.BanModal);

  if (isDeleted) return null;
  return (
    <Block key={`message-${message.id}`}>
      {/* Size is picked to match single line text height */}
      <Avatar type={AvatarTypes.Profile} size={54} circle image={message.author.avatar} />
      <Space />
      <Content>
        <Title isSelf={message.sender === uid} onClick={() => message.author?.username && history.push(`/${message.author?.username}`)}>
          {message.author?.display_name}
          <Time>{time}</Time>
        </Title>
        {blocked 
          ? <h6><span className='text-primary'>Content hidden. User is blocked.</span></h6>
          : <>
              <Text><RichRender value={message.text} /></Text>
              {message.media && message.mediaURL &&
                <Media
                  bigger={bigger}
                  exists={message.media ? true : false}
                  src={message.mediaURL} onClick={() => setBigger(!bigger)}
                  alt="media"
                />
              }
            </>
        }
      </Content>
      <ActionButtons>
      {canDelete && (
          <ActionButton onClick={() => setShowDeleteModal(true)}>
            <FilledIcon $solid $color="error" as={TrashIcon} />
          </ActionButton>
      )}
      {/* {isMod && (
        <ActionButton onClick={() => banModal.open({
          username: message.author.username,
          id: message.author.id,
        })}>
          <FilledIcon $solid $color="error" as={EyeOff} />
        </ActionButton>
      )} */}
      </ActionButtons>

      <Confirm message="Are you sure you would like to delete this message?" yesMessage="Delete Message" isOpen={showDeleteModal} onYes={actionDeletePost} onNo={actionDidNotDeletePost}/>
    </Block>
  );
};

export default Message;
