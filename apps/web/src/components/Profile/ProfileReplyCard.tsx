// A single row in the profile's Replies tab. Shows a compact
// parent-post header (avatar + name + handle + 'Replying to @author')
// then the user's reply text + the standard comment action row.
// Clicking the parent header jumps to the post's thread route.

import React from 'react';
import { ChatAltIcon, HeartIcon } from '@heroicons/react/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/solid';
import { useRouter } from 'next/router';

import useMedia from 'hooks/useMedia';
import { useCommentRow } from 'hooks/useComment';
import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
import RichRender from 'components/Rich/RichRender';
import { timeAgoStringAbbreviation, truncateLargeumbers } from 'utils/common_utils';

type Props = {
  comment: any;
};

const ProfileReplyCard: React.FC<Props> = ({ comment }) => {
  const router = useRouter();
  const replyAvatar = useMedia(comment?.author?.avatar);
  const parentAvatar = useMedia(comment?.post?.author?.avatar);
  const { isLiked, likeCount, toggleLike } = useCommentRow(comment);

  const goToThread = () => {
    if (comment?.post?.uuid) router.push(`/post/${comment.post.uuid}`);
  };

  return (
    <div className="border-b border-dividerColor px-4 py-3 hover:bg-backgroundNormal transition-colors">
      {/* Parent context — compact "Replying to" header */}
      {comment.post && (
        <div
          className="mb-2 flex items-center gap-2 text-sm cursor-pointer"
          onClick={goToThread}
        >
          <Avatar
            type={AvatarTypes.Profile}
            size={20}
            circle={comment.post.author?.accountType !== 'ORG'}
            image={parentAvatar}
          />
          <span className="text-fontTertiary truncate">
            Replying to <span className="text-primary">@{comment.post.author?.username}</span>
          </span>
        </div>
      )}

      {/* Reply body — same layout as DisplayComment */}
      <div className="flex gap-3">
        <Avatar
          type={AvatarTypes.Profile}
          size={40}
          circle={comment.author?.accountType !== 'ORG'}
          image={replyAvatar}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-sm">
            <span className="font-semibold text-fontFocus">
              {comment.author?.name || comment.author?.username}
            </span>
            <span className="text-fontTertiary">@{comment.author?.username}</span>
            <span className="text-fontTertiary">·</span>
            <span className="text-fontTertiary">
              {timeAgoStringAbbreviation(new Date(comment.createdAt))}
            </span>
          </div>
          <div className="mt-0.5 text-fontPrimary text-sm leading-5">
            <RichRender value={comment.text} />
          </div>
          <div className="mt-2 flex items-center gap-4 text-fontTertiary text-xs">
            <button
              type="button"
              onClick={goToThread}
              className="flex items-center gap-1 hover:text-primary transition-colors"
              aria-label="Open thread"
            >
              <ChatAltIcon className="w-4 h-4" />
              View thread
            </button>
            <button
              type="button"
              onClick={() => toggleLike()}
              className={`flex items-center gap-1 hover:text-error transition-colors ${isLiked ? 'text-error' : ''}`}
              aria-label={isLiked ? 'Unlike' : 'Like'}
            >
              {isLiked ? <HeartSolid className="w-4 h-4" /> : <HeartIcon className="w-4 h-4" />}
              {likeCount > 0 && <span>{truncateLargeumbers(likeCount)}</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileReplyCard;
