// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Modal from 'components/Modal';
import { toggleEditChannelModal } from 'store/appSlice';
import { deleteChannel, updateChannel } from 'store/communitySlice';
import { selectEditChannelState } from 'store/selectors';
import { Space } from 'styles/layout';
import { NewChannelState } from 'types/channel';

import CreateChannelForm from './CreateChannelForm';
import { Container } from './styled';


const EditChannelModal: React.FC = () => {
  const dispatch = useDispatch();
  const channel = useSelector(selectEditChannelState);

  const onSubmit = (form : NewChannelState) => {
    dispatch(updateChannel(form));
  };

  const handleCloseModal = () => {
    dispatch(toggleEditChannelModal());
  };

  const handleDelete = () => {
    dispatch(deleteChannel());
  };

  return (
    <Modal
      isOpen={channel !== null}
      onRequestClose={handleCloseModal}
      shouldCloseOnOverlayClick={false}
      style={{
        content:{
          display: 'flex',
          justifyContent:'center',
          margin: 'auto',
          height: 'fit-content',
          maxWidth: '800px',
        },
      }}
    >
      {channel && (
        <Container>
          <h1>Edit Room</h1>
          <Space direction='column'/>
          <CreateChannelForm
            onSubmit={onSubmit}
            onCancel={handleCloseModal}
            onDelete={handleDelete}
            canChangeType={false}
            state={{
              access: channel.access,
              channeltype: channel.type,
              description: channel.description,
              name: channel.name,
              permissions: channel.permissions,
              id: channel.id,
            }}
            isEdit
          />
        </Container>
      )}
    </Modal>
  );
};

export default EditChannelModal;
