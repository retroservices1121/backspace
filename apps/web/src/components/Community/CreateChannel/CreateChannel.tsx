// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';

import useCommunities from 'hooks/entities/useCommunities';
import { useRegisterModal } from 'lib/Modal';
import { Space } from 'styles/layout';
import { Modals } from 'utils/constants';

import CreateChannelForm from './CreateChannelForm';

type Props = { edit: boolean };

const CreateChannelModal: React.VFC<Props> = ({ edit }) => {
  const { current: { community, channel }, run } = useCommunities();
  let Modal = useRegisterModal(Modals.CreateChannel);
  if (edit) { //Not the greatest implementation but allows reuse
    Modal = useRegisterModal(Modals.EditChannel);
  }
  

  return (
    <Modal shouldCloseOnOverlayClick={false}>
      <div className="py-10 px-12 max-h-screen text-center overflow-auto">
        {edit 
          ? <>
            <h2 className="text-center">Edit Room</h2>
            <h4 className="text-center">{`in ${community.name}`}</h4>
            <Space direction='column'/>
          </>
          : <>
            <h2 className="text-center">Add New Room</h2>
            <h4 className="text-center">{`to ${community.name}`}</h4>
            <h5 className="text-center mt-6">You can change the name, description, and permissions later.</h5>
            <Space direction='column'/>
          </>
          
        }
        
        <CreateChannelForm state={edit ? channel : undefined} onSubmit={run.createChannel} onCancel={Modal.close}/>
      </div>
    </Modal>
  );
};
export default CreateChannelModal;
