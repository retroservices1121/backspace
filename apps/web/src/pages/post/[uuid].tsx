// Dedicated post-thread route — X parity for /username/status/<id>.
// Pulls the post by uuid, reuses MediaPost for the head, drops a
// reply composer below it, then renders the flat reply list. Back
// arrow + page title match the X header pattern.

import React, { useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/outline';
import { useQuery } from 'react-query';
import { useRouter } from 'next/router';

import CommentsList from 'components/Comment/CommentsList';
import ReplyComposer from 'components/Comment/ReplyComposer';
import { Container, FeedContainer } from 'components/Feed/styles';
import MediaPost from 'components/MediaPost';
import { HideOnMobile } from 'components/NavigationV2/styled';
import DesktopFeedDrawer from 'components/Feed/DesktopFeedDrawer';
import FeedDrawer from 'components/Feed/FeedDrawer';
import axios from 'lib/axios';
import { setPageTitle } from 'store/appSlice';
import { useAppDispatch } from 'store/store';
import { Comment, Post } from 'types/prisma';

const PostThreadPage: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const uuid = router.query.uuid as string | undefined;

  useEffect(() => {
    dispatch(setPageTitle('Post'));
  }, []);

  const { data: post } = useQuery<Post | null>(
    ['post-by-uuid', uuid],
    async () => {
      if (!uuid) return null;
      const { data } = await axios().get<Post>(`/post?uuid=${uuid}`);
      return data ?? null;
    },
    { enabled: !!uuid, staleTime: 30_000 },
  );

  const { data: comments, refetch: refetchComments } = useQuery<Comment[]>(
    ['post-comments', post?.id?.toString()],
    async () => {
      if (!post?.id) return [];
      const { data } = await axios().get<Comment[]>(`/comments?postId=${post.id}`);
      return data ?? [];
    },
    { enabled: !!post?.id, staleTime: 15_000 },
  );

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push('/');
  };

  return (
    <Container>
      <HideOnMobile className="hidden sm:flex">
        <DesktopFeedDrawer contentPosition={0} />
      </HideOnMobile>
      <FeedDrawer />
      <FeedContainer>
        <div className="w-screen md:w-media">
          {/* Sticky thread header — back arrow + 'Post' title. */}
          <div className="sticky top-0 z-10 flex items-center gap-6 border-b border-dividerColor bg-backgroundDark/80 px-4 py-3 backdrop-blur">
            <button
              type="button"
              onClick={goBack}
              className="p-1 rounded-full hover:bg-backgroundLight"
              aria-label="Back"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <span className="text-lg font-semibold">Post</span>
          </div>

          {post && <MediaPost post={post} />}

          <ReplyComposer
            postId={post?.id}
            replyToUsername={post?.author?.username}
            onPosted={() => refetchComments()}
          />

          <CommentsList comments={comments} />
        </div>
      </FeedContainer>
    </Container>
  );
};

export default PostThreadPage;
