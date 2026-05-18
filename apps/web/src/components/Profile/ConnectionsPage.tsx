// Followers / Following list for a profile. One component drives
// both /[username]/followers and /[username]/following — they share
// the same row UI and sticky top header with a Following/Followers
// tab strip. Avatars resolve client-side through useMedia so we don't
// couple the API to a storage driver.

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import type { Media } from '@prisma/client';
import { ArrowLeftIcon } from '@heroicons/react/outline';

import { useAxios } from '@src/hooks/useAxios';
import useMedia from '@src/hooks/useMedia';
import useUser from 'hooks/useUser';
import { useGetProfileByUsernameQuery } from 'services/user';
import { fetchUser } from 'store/userSlice';
import { useAppDispatch } from 'store/store';
import { ShellIcons as I } from 'components/Shell/icons';
import { FollowBody } from 'pages/api/follow';

type ConnectionTab = 'followers' | 'following';

type ConnectionRow = {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  verified: boolean;
  accountType?: string;
  avatar: Media | null;
};

type Props = {
  username: string;
  tab: ConnectionTab;
};

const ConnectionsPage: React.FC<Props> = ({ username, tab }) => {
  const router = useRouter();
  const axios = useAxios();
  const { user: viewer } = useUser();
  const { data: profileRes } = useGetProfileByUsernameQuery(username);
  const profile = profileRes?.user;

  const { data, isLoading } = useQuery<ConnectionRow[]>(
    ['connections', username, tab],
    async () => {
      const { data: rows } = await axios.get(
        `/users/${encodeURIComponent(username)}/${tab}`,
      );
      return Array.isArray(rows) ? rows : [];
    },
    { enabled: !!username, staleTime: 30_000 },
  );

  const switchTab = (next: ConnectionTab) => {
    if (next === tab) return;
    router.push(`/${encodeURIComponent(username)}/${next}`);
  };

  const displayName = profile?.name || username;

  return (
    <div className="font-display text-ink">
      <Head>
        <title>
          {`${displayName} · ${tab === 'followers' ? 'Followers' : 'Following'} · Backspace`}
        </title>
      </Head>

      {/* Sticky header — back arrow, name, @handle. */}
      <div
        className="
          sticky top-0 z-10
          flex items-center gap-4
          px-5 py-3
          border-b border-line
          bg-canvas/[0.78]
          backdrop-blur-[14px] backdrop-saturate-[160%]
        "
      >
        <button
          type="button"
          onClick={() => router.push(`/${encodeURIComponent(username)}`)}
          className="
            w-9 h-9 rounded-full flex items-center justify-center
            text-ink-2 hover:bg-hover hover:text-ink transition-colors
          "
          aria-label="Back to profile"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h1 className="m-0 text-[18px] font-bold tracking-[-0.02em] text-ink truncate">
            {displayName}
          </h1>
          <div className="text-[12px] text-ink-3 font-mono truncate">
            @{username}
          </div>
        </div>
      </div>

      {/* Following / Followers tabs. */}
      <div className="border-b border-line bg-canvas">
        <div className="flex items-center px-2">
          <TabButton
            label="Following"
            active={tab === 'following'}
            onClick={() => switchTab('following')}
          />
          <TabButton
            label="Followers"
            active={tab === 'followers'}
            onClick={() => switchTab('followers')}
          />
        </div>
      </div>

      {/* Body */}
      {isLoading && (
        <div className="px-5 py-10 text-center text-[13px] text-ink-3">
          Loading…
        </div>
      )}
      {!isLoading && (data?.length ?? 0) === 0 && (
        <div className="px-5 py-12 text-center text-[13px] text-ink-3">
          {tab === 'followers'
            ? `${displayName} doesn't have any followers yet.`
            : `${displayName} isn't following anyone yet.`}
        </div>
      )}
      {(data ?? []).map((row) => (
        <ConnectionRowItem
          key={row.id}
          row={row}
          viewerId={viewer?.id}
          viewerFollowing={(viewer?.following ?? []) as Array<{ accountId: bigint }>}
        />
      ))}
    </div>
  );
};

function TabButton({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative px-4 py-3 text-[14px] font-medium tracking-[-0.005em]',
        'transition-colors duration-150',
        active ? 'text-ink' : 'text-ink-2 hover:text-ink',
      ].join(' ')}
    >
      <span>{label}</span>
      {active && (
        <span className="absolute left-3 right-3 -bottom-px h-[3px] rounded-full bg-brand-2" />
      )}
    </button>
  );
}

function ConnectionRowItem({
  row, viewerId, viewerFollowing,
}: {
  row: ConnectionRow;
  viewerId?: bigint;
  viewerFollowing: Array<{ accountId: bigint }>;
}) {
  const axios = useAxios();
  const dispatch = useAppDispatch();
  const { user: viewer } = useUser();
  const avatarUrl = useMedia(row.avatar);
  const router = useRouter();

  // viewer.following entries store accountId as a (possibly serialized)
  // bigint; coerce both sides to string to compare safely.
  const initiallyFollowing = !!viewerFollowing.find(
    (f) => String(f.accountId) === row.id,
  );
  const [following, setFollowing] = useState(initiallyFollowing);
  const [busy, setBusy] = useState(false);

  const isSelf = viewerId != null && String(viewerId) === row.id;

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!viewerId || busy) return;
    const next = !following;
    setBusy(true);
    setFollowing(next);
    const body: FollowBody = {
      userId: viewerId,
      accountId: BigInt(row.id),
      follow: next,
    };
    try {
      const { status } = await axios.put('follow', body);
      if (status >= 200 && status < 300) {
        if (viewer?.authId) dispatch(fetchUser(viewer.authId));
      } else {
        setFollowing(!next);
        toast.error('Failed to update follow');
      }
    } catch {
      setFollowing(!next);
      toast.error('Failed to update follow');
    } finally {
      setBusy(false);
    }
  };

  const open = () => {
    router.push(`/${encodeURIComponent(row.username)}`);
  };

  return (
    <div
      onClick={open}
      className="
        flex items-start gap-3 px-5 py-3 cursor-pointer
        border-b border-line
        hover:bg-hover transition-colors
      "
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="w-12 h-12 rounded-full flex-none object-cover"
        />
      ) : (
        <div
          className="w-12 h-12 rounded-full flex-none"
          style={{ background: 'linear-gradient(135deg,#5822FB,#FF8800)' }}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[14px] font-semibold text-ink truncate">
            {row.name}
          </span>
          {row.verified && (
            row.accountType === 'ORG'
              ? (
                <span className="text-ink inline-flex flex-none" aria-label="Verified organization">
                  <I.verifiedOrg className="w-4 h-4" />
                </span>
              )
              : (
                <span className="text-brand-2 inline-flex flex-none" aria-label="Verified">
                  <I.verified className="w-4 h-4" />
                </span>
              )
          )}
        </div>
        <div className="text-[13px] text-ink-3 font-mono truncate">
          @{row.username}
        </div>
        {row.bio && (
          <div className="mt-1 text-[13px] text-ink-2 line-clamp-2 leading-snug">
            {row.bio}
          </div>
        )}
      </div>
      {!isSelf && viewerId != null && (
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          className={
            following
              ? 'flex-none rounded-full border border-line-2 px-4 h-9 text-[13px] font-semibold text-ink hover:bg-hover transition-colors disabled:opacity-60'
              : 'flex-none rounded-full bg-ink text-canvas px-4 h-9 text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-60'
          }
        >
          {following ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  );
}

export default ConnectionsPage;
