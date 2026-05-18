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
    <div className="flex gap-3 px-4 py-3 border-b border-line hover:bg-hover transition-colors font-display text-ink">
      <Avatar
        type={AvatarTypes.Profile}
        size={40}
        circle={comment?.author?.accountType !== 'ORG'}
        image={avatar}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-[14px]">
          <span className="font-semibold text-ink truncate">
            {comment?.author?.name || comment?.author?.username}
          </span>
          <span className="text-ink-3 font-mono text-[13px] truncate">
            @{comment?.author?.username}
          </span>
          <span className="text-ink-4">·</span>
          <span className="text-ink-3 font-mono text-[12px]">
            {timeAgoStringAbbreviation(new Date(comment.createdAt))}
          </span>
          {comment.edited && (
            <span className="text-ink-3 text-[11px] font-mono">(edited)</span>
          )}
        </div>

        {editing ? (
          <div className="mt-1.5">
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
              style={{ background: 'transparent' }}
              className="
                w-full rounded-[10px] border border-line hover:border-line-2 focus:border-brand-2
                px-2.5 py-1.5 text-[14px] text-ink placeholder:text-ink-3
                outline-none transition-colors duration-150
              "
            />
            <div className="mt-1.5 flex items-center gap-2 text-[11px] font-mono">
              <button
                type="button"
                onClick={saveEdit}
                className="
                  rounded-full bg-brand hover:bg-brand-2
                  px-3 h-7 text-[12px] font-semibold text-ink
                  transition-colors duration-150
                "
              >
                Save
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="
                  rounded-full px-3 h-7 text-[12px] font-medium
                  text-ink-2 hover:bg-hover hover:text-ink
                  transition-colors
                "
              >
                Cancel
              </button>
              <span className="ml-auto text-ink-3">⌘+Enter to save · Esc to cancel</span>
            </div>
          </div>
        ) : (
          <div className="mt-0.5 text-ink text-[15px] leading-snug">
            <RichRender value={comment.text} />
          </div>
        )}

        {!editing && (
          <div className="mt-2 flex items-center gap-5 text-ink-3">
            {onReply && (
              <button
                type="button"
                onClick={() => onReply(comment)}
                className="
                  group inline-flex items-center gap-1 px-1 py-1 rounded-full
                  hover:text-brand-2 transition-colors duration-150
                "
                aria-label="Reply to this comment"
              >
                <ChatAltIcon className="w-4 h-4" />
                <span className="text-[12px] font-mono">Reply</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleLike()}
              className={[
                'group inline-flex items-center gap-1 px-1 py-1 rounded-full',
                'transition-colors duration-150',
                isLiked ? 'text-pink-vivid' : 'hover:text-pink-vivid',
              ].join(' ')}
              aria-label={isLiked ? 'Unlike' : 'Like'}
            >
              {isLiked
                ? <HeartSolid className="w-4 h-4" />
                : <HeartIcon className="w-4 h-4" />}
              <span className="text-[12px] font-mono min-w-[1ch] tabular-nums">
                {truncateLargeumbers(likeCount)}
              </span>
            </button>
            {isAuthor && (
              <>
                <button
                  type="button"
                  onClick={startEdit}
                  className="
                    inline-flex items-center px-1 py-1 rounded-full
                    hover:text-brand-2 transition-colors duration-150
                  "
                  aria-label="Edit comment"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="
                    inline-flex items-center px-1 py-1 rounded-full
                    hover:text-pink-vivid transition-colors duration-150
                  "
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
