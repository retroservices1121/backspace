// Twitter/X-style always-on composer at the top of the home feed.
// Submits text-only posts to the user's profile timeline directly; any
// flow that needs a community/channel, media, or a market attachment
// hands off to the existing CreatePost modal so we don't fork that
// logic.

import React, { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { PhotographIcon } from '@heroicons/react/outline';
import { Permissions } from '@prisma/client';
import { useModal } from '@src/lib/Modal';
import { prependPost } from '@src/store/feedSlice';
import { useAppDispatch } from '@src/store/store';
import { PostFormFields, PostFormState } from '@src/types/post';
import { Modals } from '@src/utils/constants';

import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
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
    <div className="border-b border-dividerColor px-4 py-3 w-screen md:w-media">
      <div className="flex gap-3">
        <Avatar type={AvatarTypes.Profile} size={44} circle image={avatar} />
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={text}
            placeholder="What's happening?"
            maxLength={MAX_LEN}
            onChange={(e) => { setText(e.target.value); autoSize(); }}
            onKeyDown={onKeyDown}
            rows={1}
            className="w-full resize-none bg-transparent text-fontFocus placeholder-fontTertiary text-lg leading-6 focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-primary">
              <button
                type="button"
                aria-label="Add media or attach community"
                onClick={() => CreatePostModal.open()}
                className="p-2 rounded-full hover:bg-backgroundLight"
                title="Add media, market, or post to a community"
              >
                <PhotographIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              {text.length > 0 && remaining < 200 && (
                <span className={`text-xs ${remaining < 0 ? 'text-error' : 'text-fontTertiary'}`}>
                  {remaining}
                </span>
              )}
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit}
                className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
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

export default InlineCompose;
