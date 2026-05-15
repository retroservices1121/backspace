// X-style post detail modal. Same components as the /post/[uuid]
// route — MediaPost head on top, ReplyComposer below it, then the
// flat replies list. The legacy 2-column grid with a fixed-height
// scroll box for comments is gone; modal scrolls as one column so
// long threads behave normally.

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import usePost from '@src/hooks/usePost';
import { useRegisterModal } from '@src/lib/Modal';
import { fetchComments, viewPostByUUID } from '@src/store/postSlice';
import { Button } from '@src/styles/Buttons';
import { Row } from '@src/styles/Flex';
import { Space } from '@src/styles/layout';
import { Modals } from '@src/utils/constants';
import { useRouter } from 'next/router';

import CommentsList from 'components/Comment/CommentsList';
import ReplyComposer from 'components/Comment/ReplyComposer';
import MediaPost from 'components/MediaPost';
import { RootState, useAppDispatch } from 'store/store';

type Props = {};

const PostViewer: React.FC<Props> = () => {
  const router = useRouter();
  const post = useSelector((state: RootState) => state.post);
  const comments = useSelector((state: RootState) => state.post.comments);
  const thisPost = usePost(post, true);
  const PostModal = useRegisterModal(Modals.PostViewer, false, thisPost.close);
  const DeleteModal = useRegisterModal(Modals.PostViewerDelete, true);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (router.query.post) {
      const postQuery = router.query.post as string;
      if (post.uuid !== postQuery) {
        dispatch(viewPostByUUID(postQuery));
      }
    }
  }, [router.query.post]);

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
        <div className="w-screen sm:w-media max-h-[90vh] overflow-y-auto bg-backgroundDark sm:rounded-2xl">
          {post?.id && <MediaPost post={post} />}
          <ReplyComposer
            postId={post?.id}
            replyToUsername={post?.author?.username}
            autoFocus
          />
          <CommentsList comments={comments} />
        </div>
      </PostModal>

      <DeleteModal shouldCloseOnOverlayClick={true}>
        <div className="bg-backgroundLight flex flex-col justify-center align-center text-center w-[300px] p-5">
          <h3>Are you sure you would like to delete this post?</h3>
          <br /><br />
          <Row className="justify-center align-center w-full">
            <Button color="error" onClick={deletePostAction}>Yes</Button>
            <Space />
            <Button color="none" onClick={DeleteModal.close}>Cancel</Button>
          </Row>
        </div>
      </DeleteModal>
    </>
  );
};

export default PostViewer;
