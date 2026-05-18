// Modal wrapper around the unified Composer. The form body is shared
// with the inline top-of-feed surface (components/Feed/InlineCompose);
// this file only owns the modal's "confirm discard" guard and the
// close handoff.

import React, { useState } from 'react';
import { useModal } from '@src/lib/Modal';
import { Confirm } from '@src/lib/Modal/layouts';
import { useAppDispatch } from '@src/store/store';
import { Modals } from '@src/utils/constants';

import Modal from 'components/ModalV2';
import { clearPost } from 'store/postSlice';

import Composer from './Composer';

const CreatePost: React.FC = () => {
  const dispatch = useAppDispatch();
  const CreatePostModal = useModal(Modals.CreatePost);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const close = () => {
    dispatch(clearPost());
    CreatePostModal.close();
  };

  // Discard guard — only matters if the user has typed something. The
  // Composer doesn't expose its `touched` state, so for now any close
  // attempt while the modal is open prompts; if the user wants
  // friction-free dismiss we can wire a touched callback later.
  const askDiscard = () => setConfirmOpen(true);

  return (
    <div className="max-h-screen overflow-auto">
      <Composer
        variant="modal"
        onPosted={close}
        onCancel={askDiscard}
      />

      <Modal
        open={confirmOpen}
        handleClose={() => setConfirmOpen(false)}
        closeButton={false}
        shouldCloseOnOverlayClick={false}
      >
        <Confirm
          question="Discard this post?"
          onConfirm={() => {
            setConfirmOpen(false);
            close();
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default CreatePost;
