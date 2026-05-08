// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import useComment from '@src/hooks/useComment';
import usePost from '@src/hooks/usePost';
import { useRegisterModal } from '@src/lib/Modal';
import { fetchComments, viewPostByUUID } from '@src/store/postSlice';
import { Button } from '@src/styles/Buttons';
import { Row } from '@src/styles/Flex';
import { Space } from '@src/styles/layout';
import { getMediaType } from '@src/utils/common_utils';
import { Modals } from '@src/utils/constants';
import { useRouter } from 'next/router';

import ChatInput from 'components/Rich/ChatInput';
import UserTile from 'components/User/UserTile';
import { RootState, useAppDispatch } from 'store/store';

import CommentsContainer from './CommentsContainer';
import PostDetails from './PostDetails';
import PostToolBar from './PostToolBar';
import { InputContainer, MediaPlayer } from './styled';

type Props = {};

const PostViewer:React.FC<Props> = () => {
  const router = useRouter();
  const post = useSelector((state: RootState) => state.post);
  const comments = useSelector((state: RootState) => state.post.comments);
  const thisPost = usePost(post, true);
  const thisComment = useComment(post?.id);
  // const PostModal = () => <div></div>;
  const PostModal = useRegisterModal(Modals.PostViewer, false, thisPost.close);
  const DeleteModal = useRegisterModal(Modals.PostViewerDelete, true);
  const author = post.author;
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (router.query.post) {
      const postQuery = router.query.post as string;
      //If new post query in url, open that post
      if (post.uuid != postQuery) {
        dispatch(viewPostByUUID(postQuery));
      }
    }
  }, [router.query.post]);

  /** Fetch new comments when post.id changes */
  useEffect(() => {
    if (post.id) {
      dispatch(fetchComments(post.id));
    }
    if (DeleteModal) {
      DeleteModal.close();
    }
  }, [post?.id]);

  function deletePostAction() {
    DeleteModal.close();
    thisPost.delete();
    PostModal.close();
  }

  return (
    <>
    <PostModal shouldCloseOnOverlayClick={true}>
      <>
        <div className="grid grid-flow-rows grid-cols-1 sm:grid-cols-2 h-[full] max-h-screen min-h-[200px] w-auto overflow-auto">
          {/* Hide on Mobile */}
          <div className="hidden h-0 md:block md:h-auto">
            {thisPost.mediaURL && thisPost.mediaURL.length > 0 &&
            <>
              {post.media && post.media[0] && getMediaType(post.media[0]) === 'video' 
                ? <MediaPlayer height="100%" url={thisPost.mediaURL[0]} controls loop />
                : <img className="col-span-1 h-full rounded-l-3xl aspect-square object-cover" src={thisPost.mediaURL[0]} alt="media" />
              }
            </>
            }
          </div>
          <div className={`flex grid grid-rows-10 grid-flow-cols ${thisPost?.mediaURL?.length > 0 ? 'col-span-1' : 'col-span-2'} h-full w-auto`}>
            <div className="row-span-1 pt-10 pl-5 h-fit">
              <UserTile user={author} />
            </div>
            <div className="row-span-4 col grow w-full sm:w-[500px] max-h-full overflow-y-auto">
              <div className="flex-1 px-8">
                <PostDetails title={post.title} text={post.text}/>
                <PostToolBar post={post} deletePost={DeleteModal.open}/>
              </div>
            </div>
            <Space size={'lg'} direction={'column'}/>
            {post.enableComments &&
              <div className='row-span-4 col grow mt-auto w-full h-auto'>
                <CommentsContainer comments={comments} />
                <InputContainer className="w-full">
                  <ChatInput maxHeight={200} onSubmit={(text) => thisComment.add(text)} allowMedia={false}/>
                </InputContainer>
              </div>
            }
          </div>

        </div>
      </>
    </PostModal>
    {/* Has to be sibling so that it overlays on top of PostModal */}
    <DeleteModal shouldCloseOnOverlayClick={true}>
      <div className='bg-backgroundLight flex flex-col justify-center align-center text-center w-[300px] h-[300px] p-5'>
        <h3>Are you sure you would like to delete this post?</h3>
        <br/><br/>
        <Row className='justify-center align-center w-full'>
          <Button color='error' onClick={deletePostAction}>Yes</Button>
          <Space />
          <Button color='none' onClick={DeleteModal.close}>Cancel</Button>
        </Row>
      </div>
    </DeleteModal>
  </>
  );
};

export default PostViewer;
