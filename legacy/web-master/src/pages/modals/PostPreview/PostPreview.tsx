// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect, useState  } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Timestamp } from 'firebase/firestore';
import { useTheme } from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

import { MessageUnion } from 'api/communityAPI';
import { CommentUnion, createComment, getCommentsWithAuthor, PostUnion } from 'api/PostAPI';
import Confirm from 'components/Modal/Confirm';
import Modal from 'components/ModalV2';
import ChatInput from 'components/Rich/ChatInput';
import UserTile from 'components/UserActionTile';
import PostModal from 'pages/modals/PostModal';
import { CommentDocument, MediaType, MessageType } from 'shared/types/documents';
import { toggleEditModal } from 'store/appSlice';
import { deletePost } from 'store/feedSlice';
import { RootState } from 'store/store';

import CommentsContainer from './CommentsContainer';
import PostDetails from './PostDetails';
import PostToolBar from './PostToolBar';
import { MediaPlayer } from './styled';


type Props = {
  onRequestClose: () => void;
  isOpen: boolean;
  post: MessageUnion;
};

const PostPreview:React.FC<Props> = ({
  onRequestClose, isOpen, post : parentPost,
}) => {
  const post = parentPost as PostUnion;
  const author = parentPost.author;
  const isVideo = post.media_type === MediaType.Video;
  const uid = useSelector((state: RootState) => state.user.id);
  const user = useSelector((state: RootState) => state.user);
  const [ comments, setComments ] = useState<CommentUnion[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const { editModalOpen } = useSelector((state: RootState) => state.app);
  const dispatch = useDispatch();


  const handleClosePostModal = () => {
    dispatch(toggleEditModal(false));
  };


  const actionDeletePost = async () => {
    dispatch(deletePost(post));
    onRequestClose();
    setShowDeleteModal(false);
  };

  const actionDidNotDeletePost = () => {
    setShowDeleteModal(false);
    toast.success('Post has not been deleted.');
  };

  //Comments
  const sendMessage = async (text: string) => {
    if (!text) return;
    if (post.id) {
      let temp : CommentDocument = {
        id: uuidv4(),
        type: MessageType.Comment,
        postId: post.id,
        sender: uid,
        text: text,
        edited: false,
        last_updated: Timestamp.now(),
        timestamp: Timestamp.now(),
        media: '',
        media_type: MediaType.None,
      };
      createComment(temp, post.community, post.channel);
      setComments((current) => {
        let newComment = {
          ...temp,
          author: user,
        };
        return [newComment, ...current];
      });
    } else {
      console.error('parentPost id doesnt exist');
    }
  };

  useEffect(() => {
    if (post.id) {
      const allComments = getCommentsWithAuthor(post.id, post.community, post.channel);
      allComments.then((value) => {
        setComments(value);
      });
    }
  }, [post?.id]);

  const commentsEnabled = parentPost.type === MessageType.Post && !parentPost.disable_comments;

  const theme = useTheme();

  return (
    <Modal
      open={isOpen}
      handleClose={() => {onRequestClose();}}
      shouldCloseOnOverlayClick={true}
    >
      <>
        <div className="flex w-auto overflow-y-hidden lg:max-h-[800px]">
          {post?.mediaURL && (
            <div className='tw-hidden lg:flex max-h-[800px] min-h-[500px] items-center'>
              {!isVideo && <img className="max-h-[800px] w-auto rounded-l-3xl aspect-square object-cover" src={post?.mediaURL } alt="media" />}
              {isVideo && <MediaPlayer width="100%" url={post?.mediaURL} controls loop />}
            </div>
          )}
          <div className="pt-8 pb-2 flex flex-col">

            <div className="ml-4 mr-16">
              <UserTile user={author} />
            </div>

            <div className="flex flex-col justify-between relative lg:w-[500px] max-h-[660px] overflow-y-scroll">

              <div className="mx-8">
                <PostDetails post={parentPost}/>
                <PostToolBar post={parentPost} showDeleteModal={setShowDeleteModal}/>
              </div>

              <CommentsContainer
                className='lg:w-auto'
                post={parentPost}
                comments={comments}
              />
              {commentsEnabled && (
                <>
                  <div className={`bg-[${theme.backgroundNormal}] w-full`}>
                    <ChatInput maxHeight={200} onSubmit={(text) => sendMessage(text)} allowMedia={false} />
                  </div>
                </>
              )}
            </div>

          </div>
        </div>

        <Confirm message="Are you sure you would like to delete this post?" yesMessage="Delete Post" isOpen={showDeleteModal} onYes={actionDeletePost} onNo={actionDidNotDeletePost}/>
        <PostModal
          isOpen={editModalOpen}
          onRequestClose={() => handleClosePostModal()}
          post={post}
        />
      </>
    </Modal>
  );
};

export default PostPreview;
