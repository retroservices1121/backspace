// Self-serve community creation modal. Opened from the /community
// empty state when a user isn't in any community yet. Posts to
// /api/community, which seeds the owner Member row and a default
// 'general' channel; on success we navigate to the new community.
//
// One-per-user rule is enforced server-side; on 409 we surface the
// message and navigate the user to their existing community so the
// error doesn't dead-end.

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

import { useAxios } from '@src/hooks/useAxios';
import { useModal, useRegisterModal } from '@src/lib/Modal';
import useCommunities from 'hooks/entities/useCommunities';
import { APP } from 'pages';
import { Modals } from 'utils/constants';

const NAME_MIN = 2;
const NAME_MAX = 60;
const DESC_MAX = 500;

type CreateResp =
  | {
    uuid: string;
    name: string;
    channelUuid: string;
  }
  | {
    error: string;
    message: string;
    community?: { uuid: string; name: string };
  };

const CreateCommunityModal: React.VFC = () => {
  const Modal = useRegisterModal(Modals.CreateCommunity);
  const modal = useModal(Modals.CreateCommunity);
  const axios = useAxios();
  const router = useRouter();
  const { run } = useCommunities();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    name.trim().length >= NAME_MIN &&
    name.trim().length <= NAME_MAX &&
    description.length <= DESC_MAX &&
    !submitting;

  const reset = () => {
    setName('');
    setDescription('');
    setSubmitting(false);
  };

  const close = () => {
    reset();
    modal.close();
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const { status, data } = await axios.post<CreateResp>('/community', {
        name: name.trim(),
        description: description.trim(),
      });

      // 409: already owns one. Redirect to it instead of erroring.
      if (status === 409 && 'community' in data && data.community) {
        toast.info('You already own a community — opening it.');
        close();
        // Refresh memberships so the redirect target is loaded.
        await run.init().catch(() => undefined);
        router.push(`${APP.COMMUNITY.INDEX}?c=${data.community.uuid}`);
        return;
      }

      if (status >= 200 && status < 300 && 'uuid' in data) {
        toast.success('Community created.');
        close();
        // Pull the new membership into Redux before navigating so the
        // community page hydrates immediately instead of bouncing
        // through the "noFriends" empty state again.
        await run.init().catch(() => undefined);
        router.push(`${APP.COMMUNITY.INDEX}?c=${data.uuid}`);
        return;
      }

      const msg =
        'message' in data ? data.message : 'Failed to create community.';
      toast.error(msg);
    } catch (err) {
      console.error('CreateCommunity submit failed', err);
      toast.error('Failed to create community.');
    } finally {
      setSubmitting(false);
    }
  };

  const nameRemaining = NAME_MAX - name.length;
  const descRemaining = DESC_MAX - description.length;

  return (
    <Modal shouldCloseOnOverlayClick={!submitting}>
      <div className="p-6 sm:p-7 max-w-[460px] w-full font-display text-ink">
        <h2 className="m-0 text-[20px] font-bold tracking-[-0.02em] text-ink">
          Create your community
        </h2>
        <p className="mt-2 text-[14px] text-ink-2 leading-snug">
          Spin up a space to organize takes, run channels, and host
          your own conversation. You can own one community per account.
        </p>

        <div className="mt-5">
          <label className="block text-[10px] font-mono uppercase tracking-[0.08em] text-ink-3 mb-1.5">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={NAME_MAX}
            placeholder="Macro Heads"
            style={{ background: 'transparent' }}
            className="
              w-full h-11 px-3 rounded-[10px]
              border border-line hover:border-line-2 focus:border-brand-2
              text-[15px] text-ink placeholder:text-ink-3
              outline-none transition-colors duration-150
            "
          />
          {name.length > 0 && nameRemaining < 20 && (
            <div
              className={`mt-1 text-[11px] font-mono ${
                nameRemaining < 0 ? 'text-pink-vivid' : 'text-ink-3'
              }`}
            >
              {nameRemaining} left
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-[10px] font-mono uppercase tracking-[0.08em] text-ink-3 mb-1.5">
            Description <span className="text-ink-4">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={DESC_MAX}
            rows={3}
            placeholder="What this community is about — who's it for, what gets posted, the vibe."
            style={{ background: 'transparent' }}
            className="
              w-full px-3 py-2.5 rounded-[10px]
              border border-line hover:border-line-2 focus:border-brand-2
              text-[14px] text-ink placeholder:text-ink-3
              outline-none resize-none transition-colors duration-150
            "
          />
          {description.length > 0 && descRemaining < 80 && (
            <div
              className={`mt-1 text-[11px] font-mono ${
                descRemaining < 0 ? 'text-pink-vivid' : 'text-ink-3'
              }`}
            >
              {descRemaining} left
            </div>
          )}
        </div>

        <div className="mt-3 text-[11.5px] font-mono text-ink-3">
          A default <span className="text-ink-2">#general</span> room will
          be created. You can add more rooms after.
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={close}
            disabled={submitting}
            className="
              rounded-full px-4 h-10 text-[13.5px] font-medium
              text-ink-2 hover:bg-hover hover:text-ink
              disabled:cursor-not-allowed
              transition-colors duration-150
            "
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="
              rounded-full bg-brand hover:bg-brand-2
              text-ink text-[14px] font-semibold
              h-10 px-5
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-150
              shadow-[0_8px_22px_-6px_rgba(88,34,251,0.55)]
            "
          >
            {submitting ? 'Creating…' : 'Create community'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateCommunityModal;
