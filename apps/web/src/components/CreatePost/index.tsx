// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';

import { useRegisterModal } from 'lib/Modal/hooks';
import { Modals } from 'utils/constants';

import CreatePost_ from './CreatePost';

type Props = {};

const CreatePost: React.FC<Props> = ({}) => {
  const CreatePostModal = useRegisterModal(Modals.CreatePost);
  return (
    <CreatePostModal shouldCloseOnOverlayClick={true}>
      <CreatePost_ />
    </CreatePostModal>
  );
};

export default CreatePost;
