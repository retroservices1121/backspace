// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Modal from 'components/ModalV2';
import { toggleCreateChannelModal } from 'store/appSlice';
import { createChannel } from 'store/communitySlice';
import { RootState } from 'store/store';
import { Space } from 'styles/layout';
import { NewChannelState } from 'types/channel';

import CreateChannelForm from './CreateChannelForm';

const CreateChannelModal: React.FC = () => {
  const communityName =  useSelector((state : RootState) => state.community.name);
  const dispatch = useDispatch();
  const isOpen = useSelector((state : RootState) => state.app.createChannelModelOpen);

  const onSubmit = (form : NewChannelState) => {
    dispatch(createChannel(form));
  };

  const handleCloseModal = () => {
    dispatch(toggleCreateChannelModal(false));
  };

  return (
    <Modal
      open={isOpen}
      handleClose={handleCloseModal}
      shouldCloseOnOverlayClick={false}
    >
      <div className="py-10 px-12 max-h-screen text-center overflow-auto">
        <h2 className="text-center">Add New Room</h2>
        <h4 className="text-center">{communityName && `to ${communityName}`}</h4>
        <h5 className="text-center mt-6">You can change the name, description, and permissions later.</h5>
        <Space direction='column'/>
        <CreateChannelForm  onSubmit={onSubmit} onCancel={handleCloseModal}/>
      </div>
    </Modal>
  );
};
export default CreateChannelModal;
