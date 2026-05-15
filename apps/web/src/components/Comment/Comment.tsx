// X-style comment row. Avatar on the left, name + @handle + dot +
// time on a single line, body underneath, then an actions strip with
// reply / like / delete (own). Edit mode swaps the body for an
// inline textarea — cmd/ctrl-Enter saves, Esc cancels — matching the
// pattern in BaseMessage / MediaPostHeader.

import React, { useState } from 'react';
import { ChatAltIcon, HeartIcon, PencilIcon, TrashIcon } from '@heroicons/react/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/solid';
import useMedia from '@src/hooks/useMedia';
import { Comment } from '@src/types/prisma';

import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
import RichRender from 'components/Rich/RichRender';
import useUser from 'hooks/useUser';
import { useCommentRow } from 'hooks/useComment';
import { timeAgoStringAbbreviation, truncateLargeumbers } from 'utils/common_utils';

type Props = {
  comment: Comment;
  onReply?: (comment: Comment) => void;
};

const DisplayComment: React.FC<Props> = ({ comment, onReply }) => {
  const avatar = useMedia(comment?.author?.avatar);
  const { user } = useUser();
  const { isLiked, likeCount, toggleLike, remove, edit } = useCommentRow(comment);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.text);

  const isAuthor = comment.author?.id === user?.id;

  const startEdit = () => {
    setDraft(comment.text);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(comment.text);
    setEditing(false);
  };

  const saveEdit = async () => {
    const next = draft.trim();
    if (!next || next === comment.text) {
      cancelEdit();
      return;
    }
    const ok = await edit(next);
    if (ok) setEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this reply?')) remove();
  };

  return (
    <div className="flex gap-3 px-4 py-3 border-b border-dividerColor hover:bg-backgroundNormal transition-colors">
      <Avatar
        type={AvatarTypes.Profile}
        size={40}
        circle={comment?.author?.accountType !== 'ORG'}
        image={avatar}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-sm">
          <span className="font-semibold text-fontFocus">
            {comment?.author?.name || comment?.author?.username}
          </span>
          <span className="text-fontTertiary">@{comment?.author?.username}</span>
          <span className="text-fontTertiary">·</span>
          <span className="text-fontTertiary">{timeAgoStringAbbreviation(new Date(comment.createdAt))}</span>
          {comment.edited && (
            <span className="text-fontTertiary text-xs">(edited)</span>
          )}
        </div>

        {editing ? (
          <div className="mt-1">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelEdit();
                } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  saveEdit();
                }
              }}
              autoFocus
              rows={Math.min(6, Math.max(2, draft.split('\n').length))}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-sm text-fontFocus focus:border-white/30 focus:outline-none"
            />
            <div className="mt-1 flex gap-2 text-xs">
              <button
                type="button"
                onClick={saveEdit}
                className="rounded-md bg-white/10 px-2 py-0.5 text-fontFocus hover:bg-white/20"
              >
                Save
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-md px-2 py-0.5 text-fontTertiary hover:text-fontFocus"
              >
                Cancel
              </button>
              <span className="ml-auto text-fontTertiary">⌘+Enter to save · Esc to cancel</span>
            </div>
          </div>
        ) : (
          <div className="mt-0.5 text-fontPrimary text-sm leading-5">
            <RichRender value={comment.text} />
          </div>
        )}

        {!editing && (
          <div className="mt-2 flex items-center gap-4 text-fontTertiary text-xs">
            {onReply && (
              <button
                type="button"
                onClick={() => onReply(comment)}
                className="flex items-center gap-1 hover:text-primary transition-colors"
                aria-label="Reply to this comment"
              >
                <ChatAltIcon className="w-4 h-4" />
                Reply
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleLike()}
              className={`flex items-center gap-1 hover:text-error transition-colors ${isLiked ? 'text-error' : ''}`}
              aria-label={isLiked ? 'Unlike' : 'Like'}
            >
              {isLiked ? <HeartSolid className="w-4 h-4" /> : <HeartIcon className="w-4 h-4" />}
              {likeCount > 0 && <span>{truncateLargeumbers(likeCount)}</span>}
            </button>
            {isAuthor && (
              <>
                <button
                  type="button"
                  onClick={startEdit}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                  aria-label="Edit comment"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-1 hover:text-error transition-colors"
                  aria-label="Delete comment"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DisplayComment;
