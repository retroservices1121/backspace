// X-style profile header. Cover banner with overlapping avatar,
// name + @handle (+ verified), bio, joined date + horizontal
// 'N Following · M Followers' row, and Edit/Follow + Message buttons
// on the right. No featured-community embed — that belongs in the
// body if anywhere.

import React from 'react';
import { useRouter } from 'next/router';
import { CalendarIcon } from '@heroicons/react/outline';
import useMedia from '@src/hooks/useMedia';
import { useUserAccuracy } from '@src/hooks/useUserAccuracy';

import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
import Icons from 'icons';
import { APP } from 'pages';
import SmartContent from 'components/SmartContent';
import { makeShortNumber } from 'utils/common_utils';

type ProfileLike = {
  id: bigint;
  name?: string;
  username: string;
  bio?: string;
  verified?: boolean;
  accountType?: string;
  createdAt?: Date | string;
  avatar?: any;
  banner?: any;
  _count?: {
    posts?: number;
    followers?: number;
    following?: number;
  };
};

type Props = {
  profile: ProfileLike;
  isSelf: boolean;
  isFollowing: boolean | undefined;
  onFollowToggle: () => void;
  onMessage: () => void;
};

const formatJoined = (createdAt?: Date | string) => {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
};

const ProfileHeader: React.FC<Props> = ({
  profile, isSelf, isFollowing, onFollowToggle, onMessage,
}) => {
  const router = useRouter();
  const avatar = useMedia(profile?.avatar);
  const banner = useMedia(profile?.banner);
  const joined = formatJoined(profile.createdAt);

  return (
    <div>
      {/* Banner — fills width of feed column. */}
      <div
        className="h-44 w-full bg-backgroundLight"
        style={banner
          ? { backgroundImage: `url(${banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : undefined}
      />

      {/* Avatar overlaps the banner like X. Edit/Follow button on
          the right of the same row. */}
      <div className="px-4">
        <div className="flex items-end justify-between -mt-16">
          <div className="rounded-full border-4 border-backgroundDark bg-backgroundDark">
            <Avatar
              type={AvatarTypes.Profile}
              size={128}
              circle={profile.accountType !== 'ORG'}
              image={avatar}
            />
          </div>
          <div className="flex items-center gap-2 pb-1">
            {isSelf ? (
              <button
                type="button"
                onClick={() => router.push(APP.SETTINGS.INDEX)}
                className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-semibold text-fontFocus hover:bg-backgroundLight"
              >
                Edit profile
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onMessage}
                  className="rounded-full border border-white/20 px-3 py-1.5 text-sm font-semibold text-fontFocus hover:bg-backgroundLight"
                  aria-label="Send message"
                >
                  Message
                </button>
                <button
                  type="button"
                  onClick={onFollowToggle}
                  className={
                    isFollowing
                      ? 'rounded-full border border-white/20 px-4 py-1.5 text-sm font-semibold text-fontFocus hover:bg-backgroundLight'
                      : 'rounded-full bg-fontFocus px-4 py-1.5 text-sm font-semibold text-backgroundDark hover:opacity-90'
                  }
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Name + handle */}
        <div className="mt-3">
          <div className="flex items-center gap-1">
            <span className="text-xl font-bold text-fontFocus">{profile.name || profile.username}</span>
            {profile.verified && (
              profile.accountType === 'ORG'
                ? <Icons.OrgVerified color="verified" />
                : <Icons.Verified color="verified" />
            )}
          </div>
          <div className="text-fontTertiary">@{profile.username}</div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mt-3 text-fontPrimary">
            <SmartContent>{profile.bio}</SmartContent>
          </div>
        )}

        {/* Joined date */}
        {joined && (
          <div className="mt-3 flex items-center gap-1 text-sm text-fontTertiary">
            <CalendarIcon className="w-4 h-4" />
            <span>Joined {joined}</span>
          </div>
        )}

        {/* Following / Followers — horizontal row like X. */}
        <div className="mt-3 mb-4 flex items-center gap-5 text-sm">
          <span className="cursor-pointer hover:underline">
            <span className="font-semibold text-fontFocus">
              {makeShortNumber(profile._count?.following ?? 0)}
            </span>
            <span className="text-fontTertiary"> Following</span>
          </span>
          <span className="cursor-pointer hover:underline">
            <span className="font-semibold text-fontFocus">
              {makeShortNumber(profile._count?.followers ?? 0)}
            </span>
            <span className="text-fontTertiary"> Followers</span>
          </span>
        </div>

        <AccuracyBadge username={profile.username} isSelf={isSelf} />
      </div>
    </div>
  );
};

function AccuracyBadge({ username, isSelf }: { username: string; isSelf: boolean }) {
  const { data } = useUserAccuracy(username);
  if (!data) return null;
  // Server returned `visible: false` — accuracy is hidden by privacy
  // toggle. Render nothing rather than a "private" chip; that keeps
  // the profile clean for users who simply don't trade.
  if (!data.visible) return null;
  // Visible but no stats yet — only show a placeholder to the user
  // themselves so they know the feature exists and can opt in / link
  // a wallet. Other viewers see nothing.
  if (!data.stats) {
    if (!isSelf) return null;
    return (
      <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-fontTertiary">
        No resolved positions yet. Link a Polymarket wallet in settings
        to build your accuracy badge.
      </div>
    );
  }

  const { resolvedPositions, accuracy, weightedBrierScore } = data.stats;
  const accuracyPct = accuracy !== null ? Math.round(accuracy * 100) : null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-fontTertiary">
          Calls
        </div>
        <div className="font-semibold text-fontFocus">
          {makeShortNumber(resolvedPositions)}
        </div>
      </div>
      {accuracyPct !== null && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-fontTertiary">
            Accuracy
          </div>
          <div className="font-semibold text-fontFocus">
            {accuracyPct}%
          </div>
        </div>
      )}
      {weightedBrierScore !== null && (
        <div title="Stake-weighted Brier score (lower is better calibrated)">
          <div className="text-[10px] uppercase tracking-widest text-fontTertiary">
            Brier
          </div>
          <div className="font-mono tabular-nums text-fontFocus">
            {weightedBrierScore.toFixed(3)}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileHeader;
