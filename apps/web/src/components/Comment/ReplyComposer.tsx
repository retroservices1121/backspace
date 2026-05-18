// Reply composer used in both the post-detail route and the
// PostViewer modal. Mirrors InlineCompose (avatar + auto-growing
// textarea + Post button, cmd/ctrl-Enter to submit). Shows a
// "Replying to @author" hint above the textarea, matching X.

import React, { useRef, useState } from 'react';

import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
import { useCommentComposer } from 'hooks/useComment';
import useMedia from 'hooks/useMedia';
import useUser from 'hooks/useUser';

const MAX_LEN = 12000;

type Props = {
  postId: bigint | undefined;
  /** The author of the post being replied to — used for the hint */
  replyToUsername?: string;
  /** Optional callback after a successful submit (e.g. focus the list) */
  onPosted?: () => void;
  autoFocus?: boolean;
};

const ReplyComposer: React.FC<Props> = ({ postId, replyToUsername, onPosted, autoFocus }) => {
  const { user } = useUser();
  const avatar = useMedia(user?.avatar);
  const { add } = useCommentComposer(postId);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  if (!user?.id) return null;

  const autoSize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  };

  const reset = () => {
    setText('');
    if (ref.current) ref.current.style.height = 'auto';
  };

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const ok = await add(trimmed);
      if (ok) {
        reset();
        onPosted?.();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  const remaining = MAX_LEN - text.length;
  const canSubmit = text.trim().length > 0 && !submitting && remaining >= 0;

  return (
    <div className="border-b border-line px-4 py-3 font-display text-ink">
      {replyToUsername && (
        <div className="mb-2 ml-14 text-[13px] text-ink-3">
          Replying to <span className="text-brand-2">@{replyToUsername}</span>
        </div>
      )}
      <div className="flex gap-3">
        <Avatar type={AvatarTypes.Profile} size={44} circle image={avatar} />
        <div className="flex-1 min-w-0">
          <textarea
            ref={ref}
            value={text}
            placeholder="Post your reply"
            maxLength={MAX_LEN}
            autoFocus={autoFocus}
            onChange={(e) => { setText(e.target.value); autoSize(); }}
            onKeyDown={onKeyDown}
            rows={1}
            style={{ background: 'transparent' }}
            className="w-full resize-none text-ink placeholder:text-ink-3 text-[17px] leading-6 focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-end gap-3">
            {text.length > 0 && remaining < 200 && (
              <span className={`text-[11px] font-mono ${remaining < 0 ? 'text-pink-vivid' : 'text-ink-3'}`}>
                {remaining}
              </span>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="
                rounded-full bg-brand hover:bg-brand-2
                px-4 h-9 text-[14px] font-semibold text-ink
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors duration-150
                shadow-[0_8px_22px_-6px_rgba(88,34,251,0.55)]
              "
            >
              Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplyComposer;
