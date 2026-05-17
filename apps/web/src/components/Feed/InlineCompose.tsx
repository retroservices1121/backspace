// Always-on composer at the top of the home feed. Ports the
// /webui design: gradient-ring avatar, transparent "What's the
// take?" textarea, "Attach a prediction market" gradient strip
// (the visual centerpiece), and a brand-purple Post pill. Text-
// only posts submit inline; any flow that needs media, a market
// attachment, or a community channel hands off to the existing
// CreatePost modal — same handoff pattern as the legacy
// composer, just behind the new chrome.

import React, { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  ChartBarIcon,
  LocationMarkerIcon,
  PhotographIcon,
} from '@heroicons/react/outline';
import { Permissions } from '@prisma/client';
import { useModal } from '@src/lib/Modal';
import { prependPost } from '@src/store/feedSlice';
import { useAppDispatch } from '@src/store/store';
import { PostFormFields, PostFormState } from '@src/types/post';
import { Modals } from '@src/utils/constants';

import { ShellIcons as I } from 'components/Shell/icons';
import { useAxios } from 'hooks/useAxios';
import useMedia from 'hooks/useMedia';
import useUser from 'hooks/useUser';

const MAX_LEN = 12000;

const InlineCompose: React.FC = () => {
  const { user } = useUser();
  const avatar = useMedia(user?.avatar);
  const axios = useAxios();
  const dispatch = useAppDispatch();
  const CreatePostModal = useModal(Modals.CreatePost);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!user?.id) return null;

  const autoSize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  };

  const reset = () => {
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    const body = {
      [PostFormFields.Caption]: trimmed,
      [PostFormFields.CommentsEnabled]: true,
      [PostFormFields.PermissionsRequired]: Permissions.EVERYONE,
      [PostFormFields.Profile]: true,
      [PostFormFields.Tags]: [],
    } as unknown as PostFormState;
    try {
      const { status, data } = await axios.post('/post', body);
      if (status === 200) {
        if (data) dispatch(prependPost(data));
        reset();
      } else {
        toast.error('Failed to post');
      }
    } catch (err) {
      console.error('InlineCompose submit failed', err);
      toast.error('Failed to post');
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
    <div className="border-b border-line px-5 py-4 font-display text-ink">
      <div className="flex gap-3">
        {/* Avatar with brand-2 ring — matches the design's 42px
            gradient avatar treatment. */}
        <div className="flex-none w-[42px] h-[42px] rounded-full overflow-hidden ring-2 ring-brand-2/30">
          {avatar
            ? <img src={avatar} alt="" className="w-full h-full object-cover" />
            : (
              <div
                className="w-full h-full"
                style={{ background: 'linear-gradient(135deg,#5822FB,#FF8800)' }}
              />
            )}
        </div>

        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={text}
            placeholder="What's the take?"
            maxLength={MAX_LEN}
            onChange={(e) => { setText(e.target.value); autoSize(); }}
            onKeyDown={onKeyDown}
            rows={1}
            className="
              w-full resize-none bg-transparent
              text-[18px] leading-snug text-ink
              placeholder:text-ink-3
              focus:outline-none
            "
          />

          {/* The "Attach a prediction market" strip — the visual
              centerpiece of the composer per the design. Clicking
              opens the existing CreatePost modal (which has the
              market picker + media uploader + community selector). */}
          <button
            type="button"
            onClick={() => CreatePostModal.open()}
            className="
              mt-3 w-full flex items-center gap-3 p-3 rounded-[12px]
              border border-brand-2/30 hover:border-brand-2/50
              text-left transition-colors duration-150
            "
            style={{
              background:
                'linear-gradient(140deg, rgba(88,34,251,0.14), rgba(123,76,255,0.04))',
            }}
          >
            <span
              className="
                flex-none w-9 h-9 rounded-[8px]
                flex items-center justify-center
                text-brand-2 bg-brand-soft
              "
            >
              <I.markets className="w-[18px] h-[18px]" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[14px] font-semibold text-ink">
                Attach a prediction market
              </span>
              <span className="block text-[12px] text-ink-3">
                Turn your take into a tradeable position. Earn fees as it trades.
              </span>
            </span>
            <span className="flex-none text-brand-2">
              <I.arrowR className="w-5 h-5" />
            </span>
          </button>

          {/* Action row — image / gif / poll / pin / Post. All non-
              text affordances hand off to the CreatePost modal for
              now (no inline image picker yet). */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <IconAction onClick={() => CreatePostModal.open()} label="Add image">
                <PhotographIcon className="w-[18px] h-[18px]" />
              </IconAction>
              <IconAction onClick={() => CreatePostModal.open()} label="Add GIF">
                <I.markets className="w-[18px] h-[18px] invisible" />
                <span className="text-[11px] font-mono font-semibold">GIF</span>
              </IconAction>
              <IconAction onClick={() => CreatePostModal.open()} label="Add poll">
                <ChartBarIcon className="w-[18px] h-[18px]" />
              </IconAction>
              <IconAction onClick={() => CreatePostModal.open()} label="Add location">
                <LocationMarkerIcon className="w-[18px] h-[18px]" />
              </IconAction>
            </div>
            <div className="flex items-center gap-3">
              {text.length > 0 && remaining < 200 && (
                <span
                  className={`text-[12px] font-mono ${
                    remaining < 0 ? 'text-pink-vivid' : 'text-ink-3'
                  }`}
                >
                  {remaining}
                </span>
              )}
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit}
                className="
                  rounded-full bg-brand hover:bg-brand-2
                  text-ink text-[14px] font-semibold
                  h-9 px-5
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-150
                  shadow-[0_8px_22px_-6px_rgba(88,34,251,0.55)]
                "
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function IconAction({
  children, onClick, label,
}: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="
        w-[34px] h-[34px] rounded-full flex items-center justify-center
        text-brand-2 hover:bg-brand-soft transition-colors duration-150
      "
    >
      {children}
    </button>
  );
}

export default InlineCompose;
