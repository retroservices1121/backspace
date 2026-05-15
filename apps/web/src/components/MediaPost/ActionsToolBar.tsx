import { useEffect, useState } from 'react';
import { CommentButton } from '@src/components/MediaPost/styled';
import usePost from '@src/hooks/usePost';

import Icons from 'icons';
import { Post } from 'types/prisma';
import { timeAgoString, truncateLargeumbers } from 'utils/common_utils';

interface OwnProps {
  open: () => void;
  actionLikePost: () => void;
  post: Post;
  isLiked: boolean;
}

export default function ActionsToolBar({ post, open, isLiked, actionLikePost }: OwnProps) {
  const [likeString, setLikeString] = useState<string>('');
  const thisPost = usePost(post);

  const commentString = (comments : number) => {
    if (comments <= 0) { return 'Add Your Comment!'; }
    if (comments === 1) { return 'View 1 Comment'; }
    return `View All ${truncateLargeumbers(comments)} Comments`;
  };

  const createLikeString = (likes : number) => {
    if (likes <= 0) { return 'Be the first like!'; }
    if (likes === 1) { return '1 Like'; }
    return `${truncateLargeumbers(likes)} Likes`;
  };

  useEffect(() => {
    setLikeString(createLikeString(post?._count?.likes));
  }, [post]);



  return (
    <div className="mt-2 flex justify-between items-center">
      <div className="flex items-center gap-3 text-sm">
        <CommentButton onClick={open}>{commentString(post?._count?.comments)}</CommentButton>
        {/* Timestamp links into the post detail (URL-modal), matching
            Twitter's behavior where clicking the time opens the thread. */}
        <span className="cursor-pointer hover:underline" onClick={open}>
          {timeAgoString(new Date(post.createdAt))}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-sm mr-1">{likeString}</span>
        <button
          type="button"
          onClick={actionLikePost}
          className="p-2 flex items-center cursor-pointer rounded-full hover:bg-backgroundLight"
        >
          <Icons.Heart active={isLiked} allowFill={isLiked} strokeWidth={'2'} className={'sm:motion-safe:hover:animate-beat'}/>
        </button>
        <button
          type="button"
          onClick={thisPost.share}
          className="p-2 flex items-center cursor-pointer rounded-full hover:bg-backgroundLight"
        >
          <Icons.Share />
        </button>
      </div>
    </div>
  );
}

