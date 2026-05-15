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
import { Modals } from '@src/utils/constants';

import OverlayLoading from 'components/Loading/OverlayLoader';
import Modal from 'components/ModalV2';
import { PostFormState } from 'types/post';

import CreatePostForm from './CreatePostForm';
import { PostOptions } from './styled';

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
    try {
      const result = post.id
        ? await thisPost.update(state)
        : await thisPost.create(state, media);

      if (result) {
        CreatePostModal.close();
        toast.info(post.id ? 'Post updated' : 'Post created');
      } else {
        toast.error(post.id ? 'Failed to update post' : 'Failed to create post');
      }
    } catch (err) {
      // A thrown request (500, network error) must not leave the
      // overlay spinner up — `finally` clears it regardless.
      console.error('Post submit failed', err);
      toast.error(post.id ? 'Failed to Update Post' : 'Failed To Create Post');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="max-h-screen overflow-auto">
      {submitLoading && <OverlayLoading text='Submitting Post...'/>}
      {/* Single-column, X-style composer. Media attach lives inside the
          form now, not as a separate side panel. */}
      <PostOptions>
        <CreatePostForm
          onTouched={() => setTouched(true)}
          onSubmit={handleSubmit}
          onCancel={openConfirmModal}
          setMedia={setMedia}
        />
      </PostOptions>

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
