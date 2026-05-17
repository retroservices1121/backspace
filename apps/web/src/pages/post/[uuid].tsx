// Dedicated post-thread route — /post/[uuid]. Sticky back-arrow
// header, the post itself rendered in the new design via NewPost,
// reply composer, and the flat reply list. No legacy wrapper.

import React, { useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/outline';
import { useQuery } from 'react-query';
import { useRouter } from 'next/router';

import CommentsList from 'components/Comment/CommentsList';
import ReplyComposer from 'components/Comment/ReplyComposer';
import NewPost from 'components/Post/NewPost';
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
    <div className="font-display text-ink">
      <div
        className="
          sticky top-0 z-10
          px-5 py-3
          border-b border-line
          bg-canvas/[0.78]
          backdrop-blur-[14px] backdrop-saturate-[160%]
          flex items-center gap-4
        "
      >
        <button
          type="button"
          onClick={goBack}
          className="
            w-9 h-9 rounded-full flex items-center justify-center
            text-ink-2 hover:bg-hover hover:text-ink transition-colors
          "
          aria-label="Back"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <span className="text-[18px] font-semibold text-ink">Post</span>
      </div>

      {post && <NewPost post={post} />}

      <ReplyComposer
        postId={post?.id}
        replyToUsername={post?.author?.username}
        onPosted={() => refetchComments()}
      />

      <CommentsList comments={comments} />
    </div>
  );
};

export default PostThreadPage;
