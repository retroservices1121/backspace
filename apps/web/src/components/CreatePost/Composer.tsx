// Unified composer — one source of truth for both the inline
// top-of-feed surface and the modal entry point. Replaces the split
// between InlineCompose (text-only fast path) and CreatePostForm
// (Formik modal). All affordances live here:
//
//   • Audience pill ("Timeline ▾" / "Community → Channel")
//   • Market attachment (MarketPicker)
//   • Image attachment (file input + inline preview)
//   • Character counter + Post button
//
// Submission goes through usePost so media upload + feed prepend +
// channel-message mirror all keep working. Edit mode (state.post.id
// set) routes through usePost.update; new posts through .create.
//
// variant prop only affects chrome (padding, optional cancel
// affordance); the form body itself is identical between surfaces.

import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { PhotographIcon, XIcon } from '@heroicons/react/outline';
import { Permissions } from '@prisma/client';
import { selectPostableCommunities } from '@src/store/community/selectors';
import { clearPost } from '@src/store/postSlice';
import { RootState, useAppDispatch, useAppSelector } from '@src/store/store';
import { PostFormFields, PostFormState } from '@src/types/post';

import useMedia from 'hooks/useMedia';
import usePost from 'hooks/usePost';
import useUser from 'hooks/useUser';

import MarketPicker from './MarketPicker';

const MAX_LEN = 12000;

type Audience =
  | { kind: 'profile' }
  | {
    kind: 'channel';
    communityId: number | string;
    communityName: string;
    channelId: number | string;
    channelName: string;
    readPermission: Permissions;
  };

type Props = {
  /** Modal variant adds extra padding + a cancel button. Inline is the
   *  always-on top-of-feed surface (no cancel, no chrome). */
  variant?: 'inline' | 'modal';
  /** Called after a successful submission. Modal uses this to close. */
  onPosted?: () => void;
  /** Modal cancel handler — only rendered when provided. */
  onCancel?: () => void;
};

const Composer: React.FC<Props> = ({ variant = 'inline', onPosted, onCancel }) => {
  const dispatch = useAppDispatch();
  const { user } = useUser();
  const avatar = useMedia(user?.avatar);

  // State.post is the Redux slot that the edit flow populates when the
  // user clicks edit on a feed post. For the inline surface this is
  // usually empty — we treat .id presence as the edit-mode signal.
  const post = useAppSelector((s: RootState) => s.post);
  const thisPost = usePost(post);
  const editing = !!post?.id;

  const postLocations = useSelector(selectPostableCommunities);

  const [text, setText] = useState(editing ? post?.text || '' : '');
  const [marketId, setMarketId] = useState<string | null>(
    editing && post?.marketId ? String(post.marketId) : null,
  );
  const [media, setMedia] = useState<File | undefined>(undefined);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [audience, setAudience] = useState<Audience>({ kind: 'profile' });
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const audienceRef = useRef<HTMLDivElement>(null);

  // Hydrate edit-mode text once when post id flips. Without this, the
  // textarea stays empty after clicking edit on a post.
  useEffect(() => {
    if (editing) {
      setText(post?.text || '');
      setMarketId(post?.marketId ? String(post.marketId) : null);
    }
  }, [post?.id]);

  // Dismiss the audience popover on outside click.
  useEffect(() => {
    if (!audienceOpen) return;
    const onDown = (e: MouseEvent) => {
      if (audienceRef.current && !audienceRef.current.contains(e.target as Node)) {
        setAudienceOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [audienceOpen]);

  if (!user?.id) return null;

  const autoSize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  };

  const reset = () => {
    setText('');
    setMarketId(null);
    setMedia(undefined);
    setMediaPreview(null);
    setAudience({ kind: 'profile' });
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMedia(file);
    setMediaPreview(URL.createObjectURL(file));
    setMediaType(file.type.includes('video') ? 'video' : 'image');
    e.target.value = '';
  };

  const removeMedia = () => {
    setMedia(undefined);
    setMediaPreview(null);
  };

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const formData: PostFormState = {
        [PostFormFields.Caption]: trimmed,
        [PostFormFields.CommentsEnabled]: true,
        [PostFormFields.PermissionsRequired]: Permissions.EVERYONE,
        [PostFormFields.Profile]: audience.kind === 'profile',
        // The legacy PostBody shape expects { value: { id } } wrappers
        // around community + channel; build the minimal version.
        [PostFormFields.Community]: audience.kind === 'channel'
          ? ({ value: { id: audience.communityId } } as unknown as PostFormState['community'])
          : undefined as unknown as PostFormState['community'],
        [PostFormFields.Channel]: audience.kind === 'channel'
          ? ({ value: { id: audience.channelId, readPermission: audience.readPermission } } as unknown as PostFormState['channel'])
          : undefined as unknown as PostFormState['channel'],
        [PostFormFields.Tags]: [],
        [PostFormFields.Market]: marketId,
        [PostFormFields.Token]: null,
      };

      const ok = editing
        ? await thisPost.update(formData)
        : await thisPost.create(formData, media);

      if (ok) {
        reset();
        toast.info(editing ? 'Post updated' : 'Posted');
        if (editing) dispatch(clearPost());
        onPosted?.();
      } else {
        toast.error('Failed to post');
      }
    } catch (err) {
      console.error('Composer submit failed', err);
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

  const audienceLabel =
    audience.kind === 'profile' ? 'Timeline' : `${audience.communityName} · ${audience.channelName}`;

  const isModal = variant === 'modal';

  return (
    <div
      className={[
        'font-display text-ink',
        isModal ? 'px-5 py-4' : 'border-b border-line px-5 py-4',
      ].join(' ')}
    >
      <div className="flex gap-3">
        <div className="flex-none w-[42px] h-[42px] rounded-full overflow-hidden ring-2 ring-brand-2/30">
          {avatar ? (
            <img src={avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: 'linear-gradient(135deg,#5822FB,#FF8800)' }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Audience pill — X-style. "Timeline" / "Community ▾"; expands
              into a menu of Timeline + every channel the user can post to. */}
          <div className="relative" ref={audienceRef}>
            <button
              type="button"
              onClick={() => setAudienceOpen((v) => !v)}
              className="
                inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                border border-brand-2/40 text-brand-2 text-[12.5px] font-semibold
                hover:bg-brand-soft transition-colors duration-150
              "
            >
              {audienceLabel}
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {audienceOpen && (
              <div
                className="
                  absolute z-20 mt-1 w-[260px] max-h-[300px] overflow-y-auto
                  rounded-[12px] border border-line bg-surface
                  shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] p-1.5
                "
              >
                <AudienceRow
                  active={audience.kind === 'profile'}
                  label="Timeline"
                  sub="Posts to your followers' feed"
                  onClick={() => {
                    setAudience({ kind: 'profile' });
                    setAudienceOpen(false);
                  }}
                />
                {postLocations.length > 0 && (
                  <div className="mt-1 mb-0.5 px-2 text-[10px] font-mono uppercase tracking-[0.08em] text-ink-3">
                    Communities
                  </div>
                )}
                {postLocations.map((loc) =>
                  loc.channels.map((ch) => (
                    <AudienceRow
                      key={`${loc.community.id}-${ch.id}`}
                      active={
                        audience.kind === 'channel' &&
                        String(audience.channelId) === String(ch.id)
                      }
                      label={`${loc.community.name} · ${ch.name}`}
                      sub={`Posts to ${ch.name} in ${loc.community.name}`}
                      onClick={() => {
                        setAudience({
                          kind: 'channel',
                          communityId: loc.community.id,
                          communityName: loc.community.name,
                          channelId: ch.id,
                          channelName: ch.name,
                          readPermission: ch.readPermission ?? Permissions.EVERYONE,
                        });
                        setAudienceOpen(false);
                      }}
                    />
                  )),
                )}
              </div>
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            placeholder={editing ? 'Edit your post' : "What's the take?"}
            maxLength={MAX_LEN}
            onChange={(e) => {
              setText(e.target.value);
              autoSize();
            }}
            onKeyDown={onKeyDown}
            rows={1}
            className="
              mt-3 w-full resize-none bg-transparent
              text-[18px] leading-snug text-ink
              placeholder:text-ink-3
              focus:outline-none
            "
          />

          {/* Image preview, when one's picked. Click X to remove. */}
          {mediaPreview && (
            <div className="relative mt-3 rounded-[12px] overflow-hidden border border-line">
              {mediaType === 'video' ? (
                <video src={mediaPreview} controls className="w-full max-h-[400px] object-cover" />
              ) : (
                <img src={mediaPreview} alt="" className="w-full max-h-[400px] object-cover" />
              )}
              <button
                type="button"
                onClick={removeMedia}
                aria-label="Remove media"
                className="
                  absolute top-2 right-2 w-8 h-8 rounded-full
                  bg-canvas/80 backdrop-blur-sm border border-line
                  text-ink hover:bg-canvas
                  flex items-center justify-center
                  transition-colors duration-150
                "
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Market attachment row. Renders the pill when something's
              picked, otherwise an "+ Attach market" button. */}
          <MarketPicker value={marketId} onChange={setMarketId} />

          {/* Action row — image button, char count, Post (+ Cancel in modal). */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="Add image"
                className="
                  w-[34px] h-[34px] rounded-full flex items-center justify-center
                  text-brand-2 hover:bg-brand-soft transition-colors duration-150
                "
              >
                <PhotographIcon className="w-[18px] h-[18px]" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png, image/jpeg, image/gif, video/mp4, video/x-m4v, video/*"
                className="hidden"
                onChange={onPickFile}
              />
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
              {isModal && onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="
                    rounded-full px-4 h-9 text-[13px] font-medium
                    text-ink-2 hover:bg-hover hover:text-ink
                    transition-colors duration-150
                  "
                >
                  Cancel
                </button>
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
                {editing ? 'Update' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function AudienceRow({
  active, label, sub, onClick,
}: {
  active: boolean;
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left px-2.5 py-2 rounded-[8px]',
        'flex items-start gap-2',
        'transition-colors duration-150',
        active ? 'bg-brand-soft' : 'hover:bg-hover',
      ].join(' ')}
    >
      <div className="flex-1 min-w-0">
        <div className={['text-[13px] font-semibold truncate', active ? 'text-brand-2' : 'text-ink'].join(' ')}>
          {label}
        </div>
        <div className="text-[11px] text-ink-3 font-mono truncate">{sub}</div>
      </div>
      {active && (
        <span className="flex-none text-brand-2 mt-0.5">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5 9-11" />
          </svg>
        </span>
      )}
    </button>
  );
}

export default Composer;
