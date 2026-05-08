// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import usePost from '@src/hooks/usePost';
import { useModal } from '@src/lib/Modal';
import { Confirm } from '@src/lib/Modal/layouts';
import { RootState, useAppSelector } from '@src/store/store';
import { ButtonLarge } from '@src/styles/Buttons';
import { Modals } from '@src/utils/constants';

import OverlayLoading from 'components/Loading/OverlayLoader';
import Modal from 'components/ModalV2';
import { PostFormState } from 'types/post';

import MediaUploadArea from '../MediaUploadArea';
import CreatePostForm from './CreatePostForm';
import { ConfirmCancelButton, CreatePostContainer, PostOptions } from './styled';

type Props = {};

const CreatePost:React.FC<Props> = () => {
  const CreatePostModal = useModal(Modals.CreatePost);
  const post = useAppSelector((state: RootState) => state.post);
  const thisPost = usePost(post);
  const [touched, setTouched] = useState(false);
  const [confirmationIsOpen, setConfirmationIsOpen] = useState(false);
  const [media, setMedia] = useState<File | undefined>(undefined);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  // If the user didn't write anything, we won't prompt for confirmation
  const openConfirmModal = () => {
    if (touched) {
      setConfirmationIsOpen(true);
    } else {
      CreatePostModal.close();
    }
  };

  const handleCancel = () => setConfirmationIsOpen(false);

  const handleConfirm = () => {
    setConfirmationIsOpen(false);
    CreatePostModal.close();
  };

  const handleSubmit = async (state: PostFormState) => {
    setSubmitLoading(true);
    let result : any;
    if (post.id) {
      result = await thisPost.update(state);
    } else {
      result = await thisPost.create(state, media);
    }
      
    if (result) {
      CreatePostModal.close();
      if (post.id) toast.info('Updated Post, refresh screen');
      else toast.info('Created New Post');
    } else {
      if (post.id) toast.error('Failed to Update Post');
      else toast.error('Failed To Create Post');
    }
    setSubmitLoading(false);
  };

  return (
    <div className="max-h-screen overflow-auto">
      <CreatePostContainer>
        {submitLoading && <OverlayLoading text='Submitting Post...'/>}
        {/* Left Side / Upload Area */}
        {!post?.id &&
          <MediaUploadArea setMedia={setMedia} />
        }
        {/* Right side / Input Fields */}
        <PostOptions>
          <CreatePostForm
            onTouched={() => setTouched(true)}
            onSubmit={handleSubmit}
            onCancel={openConfirmModal}
          />
        </PostOptions>
      </CreatePostContainer>

      {/* Confirm Cancel Modal */}
      <Modal
        open={confirmationIsOpen}
        handleClose={handleCancel}
        closeButton={false}
        shouldCloseOnOverlayClick={false}
      >
        <Confirm
          question='Are you sure you want to discard this post?'
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      </Modal>
    </div>
  );
};

export default CreatePost;
