// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { MessageUnion } from 'api/communityAPI';
import { createPost, CreatePostType, updatePost } from 'api/PostAPI';
import MediaUploadArea from 'components/MediaUploadArea';
import Modal from 'components/ModalV2';
import { Collections, PermissionsType } from 'shared/types/documents';
import { RootState } from 'store/store';
import { PostFormState } from 'types/feed';

import CreatePostForm from './CreatePostForm';
import { ConfirmCancelButton, CreatePostContainer, PostOptions } from './styled';

type Props = {
  onRequestClose: () => void;
  isOpen: boolean;
  post?: MessageUnion;
  // defaultDestination: ChannelDestination;
};

const PostModal:React.FC<Props> = ({
  onRequestClose, isOpen, post,
}) => {
  const user = useSelector((state: RootState) => state.user);
  const [touched, setTouched] = useState(false);
  const [confirmationIsOpen, setConfirmationIsOpen] = useState(false);
  const [media, setMedia] = useState<File | undefined>(undefined);

  // If the user didn't write anything, we won't prompt for confirmation
  const openConfirmModal = () => {
    if (touched) {
      setConfirmationIsOpen(true);
    } else {
      onRequestClose();
    }
  };

  const handleCancel = () => setConfirmationIsOpen(false);

  const handleConfirm = () => {
    setConfirmationIsOpen(false);
    onRequestClose();
  };

  const handleSubmit = async (state: PostFormState) => {
    let community = state.destination.community.value;
    let channel = state.destination.channel.value;
    let permission = state.permissionsRequired;
    //If posting to profile and no initial post conditions were supplied, override community, channel, and permission
    if (state.profile && !post) {
      community = user.id;
      channel = user.id;
      permission = PermissionsType.Anyone;
    }
    onRequestClose();
    const content : Omit<CreatePostType, 'community' | 'channel'> = {
      text: state.text,
      title: state.title,
      permission_required: permission,
      disable_comments: state.commentsDisabled,
    };
    if (post?.id) {
      const collectionPath = `${Collections.Communities}/${community}/${Collections.Channels}/${channel}/${Collections.Posts}`;
      await updatePost(post.id, collectionPath, content);
      toast.success('Post updated');
    } else {
      const newPost : CreatePostType = { ...content, community: community, channel: channel };
      //TODO add membership checks serverside someday
      await createPost(newPost, user, media);
    }
  };

  return (
    <Modal
      open={isOpen}
      handleClose={onRequestClose}
    >
      <div className="max-h-screen overflow-auto">
        <CreatePostContainer>
          {/* Left Side / Upload Area */}
          {!post &&
            <MediaUploadArea setMedia={setMedia} />
          }
          {/* Right side / Input Fields */}
          <PostOptions>
            {/* Annoying to position and not really needed now */}
            {/* <ClosePostIcon solid clickable onClick={onRequestClose} as={CloseIcon}/> */}
            {/* NOTE: CreatePostForm needs its component state to be created when the user clicks the openPostModal button */}
            {isOpen && (
              <CreatePostForm
                onTouched={() => setTouched(true)}
                onSubmit={handleSubmit}
                onCancel={openConfirmModal}
                post={post}
              />
            )}
          </PostOptions>
        </CreatePostContainer>

        {/* Confirm Cancel Modal */}
        <Modal
          open={confirmationIsOpen}
          handleClose={handleCancel}
          closeButton={false}
          shouldCloseOnOverlayClick={false}
        >
          <div className="py-12 px-12">
            <h3> Are you sure you want to discard this post?</h3>
            <div className="flex justify-center mt-12 ">
              <ConfirmCancelButton onClick={handleConfirm}>Yes</ConfirmCancelButton>
              <ConfirmCancelButton onClick={handleCancel}>Cancel</ConfirmCancelButton>
            </div>
          </div>
        </Modal>
      </div>
    </Modal>
  );
};

export default PostModal;
