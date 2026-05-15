// X-style action bar — 4 cluster buttons (reply, repost, like,
// bookmark) plus a trailing share. Each button is icon + numeric count
// in a hover-pilled hit area. View count sits next to the timestamp
// (rendered upstream of this bar — left side here).

import { BookmarkIcon, ChartBarIcon, ChatAltIcon, HeartIcon, RefreshIcon, ShareIcon } from '@heroicons/react/outline';
import { BookmarkIcon as BookmarkSolid, HeartIcon as HeartSolid } from '@heroicons/react/solid';
import usePost from '@src/hooks/usePost';
import { useRouter } from 'next/router';

import { Post } from 'types/prisma';
import { timeAgoString, truncateLargeumbers } from 'utils/common_utils';

interface OwnProps {
  open: () => void;
  actionLikePost: () => void;
  post: Post;
  isLiked: boolean;
}

const formatCount = (n: number) => (n > 0 ? truncateLargeumbers(n) : '');

export default function ActionsToolBar({ post, open, isLiked, actionLikePost }: OwnProps) {
  const thisPost = usePost(post);
  const router = useRouter();

  const replyCount = post?._count?.comments ?? 0;
  const likeCount = post?._count?.likes ?? 0;

  // Timestamp navigates to the canonical /post/[uuid] thread page —
  // X parity. Reply icon still opens the in-feed modal for quick
  // replies without losing the user's scroll position.
  const goToThread = () => router.push(`/post/${post.uuid}`);

  return (
    <div className="mt-2 flex flex-col gap-1">
      {/* Top row: timestamp + view count, left-aligned, subtle. */}
      <div className="flex items-center gap-2 text-sm text-fontTertiary">
        <span
          className="cursor-pointer hover:underline"
          onClick={goToThread}
          title="Open post"
        >
          {timeAgoString(new Date(post.createdAt))}
        </span>
        {thisPost.viewCount > 0 && (
          <span className="flex items-center gap-1">
            <ChartBarIcon className="w-3.5 h-3.5" />
            <span>{truncateLargeumbers(thisPost.viewCount)} {thisPost.viewCount === 1 ? 'view' : 'views'}</span>
          </span>
        )}
      </div>

      {/* Bottom row: 4 action buttons + trailing share, spaced out across full width. */}
      <div className="flex items-center justify-between max-w-md text-fontTertiary">
        {/* Reply */}
        <button
          type="button"
          onClick={open}
          className="group flex items-center gap-1 px-1 py-1 rounded-full hover:bg-backgroundLight hover:text-primary transition-colors"
          aria-label="Reply"
        >
          <ChatAltIcon className="w-5 h-5" />
          <span className="text-xs min-w-[1ch]">{formatCount(replyCount)}</span>
        </button>

        {/* Repost */}
        <button
          type="button"
          onClick={() => thisPost.setRepost()}
          className={`group flex items-center gap-1 px-1 py-1 rounded-full hover:bg-backgroundLight hover:text-secondary transition-colors ${thisPost.isReposted ? 'text-secondary' : ''}`}
          aria-label={thisPost.isReposted ? 'Undo repost' : 'Repost'}
        >
          <RefreshIcon className="w-5 h-5" />
          <span className="text-xs min-w-[1ch]">{formatCount(thisPost.repostCount)}</span>
        </button>

        {/* Like */}
        <button
          type="button"
          onClick={actionLikePost}
          className={`group flex items-center gap-1 px-1 py-1 rounded-full hover:bg-backgroundLight hover:text-error transition-colors ${isLiked ? 'text-error' : ''}`}
          aria-label={isLiked ? 'Unlike' : 'Like'}
        >
          {isLiked
            ? <HeartSolid className="w-5 h-5" />
            : <HeartIcon className="w-5 h-5" />}
          <span className="text-xs min-w-[1ch]">{formatCount(likeCount)}</span>
        </button>

        {/* Bookmark */}
        <button
          type="button"
          onClick={() => thisPost.setBookmark()}
          className={`group flex items-center gap-1 px-1 py-1 rounded-full hover:bg-backgroundLight hover:text-primary transition-colors ${thisPost.isBookmarked ? 'text-primary' : ''}`}
          aria-label={thisPost.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          {thisPost.isBookmarked
            ? <BookmarkSolid className="w-5 h-5" />
            : <BookmarkIcon className="w-5 h-5" />}
          <span className="text-xs min-w-[1ch]">{formatCount(thisPost.bookmarkCount)}</span>
        </button>

        {/* Share — no count */}
        <button
          type="button"
          onClick={thisPost.share}
          className="group flex items-center gap-1 px-1 py-1 rounded-full hover:bg-backgroundLight hover:text-primary transition-colors"
          aria-label="Share"
        >
          <ShareIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
