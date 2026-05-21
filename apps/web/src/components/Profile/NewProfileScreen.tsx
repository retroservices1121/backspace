// New profile screen — port of /webui's Profile screen with the
// existing data layer. Replaces the legacy ProfileHeader +
// ProfileTabs strip on desktop. Mobile reads the same component
// until the dedicated mobile UI lands.
//
// Sections:
//   1. TopTabs-style sticky header (name + post count)
//   2. Brand banner with watermark — uses uploaded banner if
//      present, falls back to the design's gradient + grid.
//   3. Profile header — overlapping avatar, name + handle +
//      conviction badge, bio, meta row (joined date), follow row
//      with Following / Followers / Hit rate.
//   4. Stats row — uses real UserAccuracy data when available:
//      Calls / Hit rate / Brier / Reputation. Hidden if the user
//      has no accuracy and isn't self.
//   5. Profile tabs — Posts / Replies / Media / Likes.
//   6. Tab content — feed-style list rendered with NewPost so the
//      profile matches the home feed visually.
//
// Data caveats:
//   - We don't have P&L or open-position counts for other users,
//     so the design's 7d / All-time / Open positions cells map
//     to accuracy-derived stats instead. This is a real signal
//     Backspace owns; P&L would be cosmetic until we aggregate
//     positions value over time.
//   - Meta row only shows Joined date; location + website aren't
//     fields on User yet.

import React from 'react';
import Loading from 'react-loading';
import Link from 'next/link';
import { useRouter } from 'next/router';

import useMedia from '@src/hooks/useMedia';
import { useUserAccuracy } from '@src/hooks/useUserAccuracy';

import { ShellIcons as I } from 'components/Shell/icons';
import CalibrationChip from 'components/Profile/CalibrationChip';
import ProfileCommunityCard from 'components/Profile/ProfileCommunityCard';
import ProfileReplyCard from 'components/Profile/ProfileReplyCard';
import NewPost from 'components/Post/NewPost';

import { APP } from 'pages';
import { makeShortNumber } from 'utils/common_utils';
import { Post } from 'types/prisma';

export type ProfileTab = 'posts' | 'replies' | 'media' | 'likes';

type ProfileLike = {
  id: bigint;
  name?: string;
  username: string;
  bio?: string;
  verified?: boolean;
  accountType?: string;
  createdAt?: Date | string;
  publicAccuracy?: boolean;
  avatar?: any;
  banner?: any;
  featuredCommunity?: any;
  communities?: any[];
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
  tab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  tabData: any[] | undefined;
};

const NewProfileScreen: React.FC<Props> = ({
  profile, isSelf, isFollowing, onFollowToggle, onMessage,
  tab, onTabChange, tabData,
}) => {
  const banner = useMedia(profile.banner);
  const featured = profile.featuredCommunity ?? profile.communities?.[0] ?? null;

  return (
    <div className="font-display text-ink">
      {/* 1. Sticky top header — matches TopTabs visually, but
          carries the profile's name + post count as title block. */}
      <ProfileTopHeader
        title={profile.name || profile.username}
        postCount={profile._count?.posts ?? 0}
      />

      {/* 2. Banner */}
      <ProfileBanner customBannerUrl={banner} />

      {/* 3. Header */}
      <ProfileBio
        profile={profile}
        isSelf={isSelf}
        isFollowing={isFollowing}
        onFollowToggle={onFollowToggle}
        onMessage={onMessage}
      />

      {/* 4. Stats row */}
      <ProfileStatsRow username={profile.username} isSelf={isSelf} />

      {/* Featured community pinned card — kept from the legacy
          profile because communities are a first-class thing on
          Backspace. Skips when no featured/owned community. */}
      {featured && (
        <div className="px-5 pb-3">
          <ProfileCommunityCard community={featured} ownerName={profile.name} />
        </div>
      )}

      {/* 5. Tabs */}
      <ProfileTabsBar active={tab} onChange={onTabChange} />

      {/* 6. Tab content */}
      <ProfileTabContent tab={tab} items={tabData} />
    </div>
  );
};

function ProfileTopHeader({ title, postCount }: { title: string; postCount: number }) {
  return (
    <div
      className="
        sticky top-0 z-10
        px-6 pt-3.5 pb-3
        border-b border-line
        bg-canvas/[0.78]
        backdrop-blur-[14px] backdrop-saturate-[160%]
        flex items-center justify-between
      "
    >
      <div>
        <h1 className="m-0 text-[20px] font-bold tracking-[-0.02em] text-ink">
          {title}
        </h1>
        <div className="mt-0.5 text-[11.5px] font-mono tracking-[0.06em] text-ink-3">
          {postCount.toLocaleString()} posts
        </div>
      </div>
      <button
        type="button"
        className="
          w-9 h-9 rounded-full flex items-center justify-center
          text-ink-2 hover:bg-hover hover:text-ink transition-colors
        "
        aria-label="More"
      >
        <I.dots className="w-5 h-5" />
      </button>
    </div>
  );
}

function ProfileBanner({ customBannerUrl }: { customBannerUrl?: string | null }) {
  // Custom banner takes precedence; fallback to the design's
  // brand-themed gradient with a faint grid overlay + centered
  // watermark. Pure CSS — no extra assets.
  if (customBannerUrl) {
    return (
      <div
        className="h-44 w-full bg-surface bg-cover bg-center"
        style={{ backgroundImage: `url(${customBannerUrl})` }}
      />
    );
  }
  return (
    <div className="relative h-44 w-full overflow-hidden bg-surface">
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(circle at 20% 30%, rgba(88,34,251,0.55), transparent 55%)',
            'radial-gradient(circle at 80% 70%, rgba(255,136,0,0.35), transparent 55%)',
            'linear-gradient(180deg, #0c0a16 0%, #08070d 100%)',
          ].join(','),
        }}
      />
      {/* faint grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: [
            'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px)',
            'linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
          ].join(','),
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-60">
        <img src="/webui/backspace-icon.png" alt="" className="w-9 h-9 rounded-md" />
        <span className="text-[28px] font-bold tracking-[-0.02em] text-ink/80">backspace</span>
      </div>
    </div>
  );
}

function ProfileBio({
  profile, isSelf, isFollowing, onFollowToggle, onMessage,
}: {
  profile: ProfileLike;
  isSelf: boolean;
  isFollowing: boolean | undefined;
  onFollowToggle: () => void;
  onMessage: () => void;
}) {
  const router = useRouter();
  const avatar = useMedia(profile.avatar);
  const joined = formatJoined(profile.createdAt);

  // Organizations get a square avatar (X-style hex affordance) +
  // a white hexagonal verified badge. Individuals get round +
  // brand-purple scalloped verified badge.
  const isOrg = profile.accountType === 'ORG';
  const avatarShape = isOrg ? 'rounded-[20px]' : 'rounded-full';
  const wrapperShape = isOrg ? 'rounded-[24px]' : 'rounded-full';
  return (
    <div className="px-5">
      {/* Avatar overlaps the banner. Right side: message + bell
          + Follow/Following pill, or Edit profile when isSelf. */}
      <div className="flex items-end justify-between -mt-16">
        <div className={`${wrapperShape} border-4 border-canvas bg-canvas`}>
          <div
            className={`w-[120px] h-[120px] ${avatarShape} overflow-hidden shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)]`}
          >
            {avatar
              ? <img src={avatar} alt="" className="w-full h-full object-cover" />
              : (
                <div
                  className="w-full h-full"
                  style={{ background: 'linear-gradient(135deg,#5822FB,#FF8800)' }}
                />
              )}
          </div>
        </div>
        <div className="flex items-center gap-2 pb-1">
          {isSelf ? (
            <button
              type="button"
              onClick={() => router.push(APP.SETTINGS.INDEX)}
              className="
                rounded-full border border-line-2 px-4 py-1.5
                text-sm font-semibold text-ink
                hover:bg-hover transition-colors
              "
            >
              Edit profile
            </button>
          ) : (
            <>
              <IconCircle onClick={onMessage} aria-label="Message">
                <I.mail className="w-[18px] h-[18px]" />
              </IconCircle>
              <IconCircle aria-label="Notifications">
                <I.bell className="w-[18px] h-[18px]" />
              </IconCircle>
              <button
                type="button"
                onClick={onFollowToggle}
                className={
                  isFollowing
                    ? 'rounded-full border border-line-2 px-4 py-1.5 text-sm font-semibold text-ink hover:bg-hover transition-colors'
                    : 'rounded-full bg-ink text-canvas px-4 py-1.5 text-sm font-semibold hover:opacity-90 transition-opacity'
                }
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Name + handle + conv badge */}
      <div className="mt-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[22px] font-bold tracking-[-0.01em] text-ink">
            {profile.name || profile.username}
          </span>
          {profile.verified && (
            isOrg
              ? (
                <span
                  className="text-ink inline-flex"
                  aria-label="Verified organization"
                  title={verifiedTooltip(true, profile.createdAt)}
                >
                  <I.verifiedOrg className="w-5 h-5" />
                </span>
              )
              : (
                <span
                  className="text-brand-2 inline-flex"
                  aria-label="Verified"
                  title={verifiedTooltip(false, profile.createdAt)}
                >
                  <I.verified className="w-5 h-5" />
                </span>
              )
          )}
        </div>
        <div className="mt-0.5 text-ink-3 font-mono text-[14px]">
          @{profile.username}
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="mt-3 text-[15px] leading-snug text-ink max-w-[520px]">
          {profile.bio}
        </p>
      )}

      {/* Meta row — only joined date for now; location + website
          aren't user fields yet. */}
      {joined && (
        <div className="mt-3 flex items-center gap-1 text-[13px] text-ink-3">
          <I.dots className="w-4 h-4 invisible" />
          <span>Joined {joined}</span>
        </div>
      )}

      {/* Follow row — inline counts. Hit rate slots in when accuracy
          is publicly visible; otherwise just Following / Followers. */}
      <FollowRow
        username={profile.username}
        followingCount={profile._count?.following ?? 0}
        followerCount={profile._count?.followers ?? 0}
      />
    </div>
  );
}

function IconCircle({
  children, onClick, ...rest
}: { children: React.ReactNode; onClick?: () => void } & React.AriaAttributes) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...rest}
      className="
        w-9 h-9 rounded-full border border-line-2
        flex items-center justify-center
        text-ink hover:bg-hover transition-colors
      "
    >
      {children}
    </button>
  );
}

function FollowRow({
  username, followingCount, followerCount,
}: { username: string; followingCount: number; followerCount: number }) {
  const accuracy = useUserAccuracy(username);
  const showHit = accuracy.data?.visible
    && accuracy.data?.stats
    && accuracy.data.stats.resolvedPositions > 0;
  const hitRatePct = showHit && accuracy.data?.stats?.accuracy != null
    ? Math.round((accuracy.data.stats.accuracy as number) * 100)
    : null;

  const safeUsername = encodeURIComponent(username);
  return (
    <div className="mt-3 mb-4 flex items-center gap-5 text-[14px]">
      <Link href={`/${safeUsername}/following`}>
        <a className="hover:underline">
          <span className="font-semibold text-ink">{makeShortNumber(followingCount)}</span>
          <span className="text-ink-3"> Following</span>
        </a>
      </Link>
      <Link href={`/${safeUsername}/followers`}>
        <a className="hover:underline">
          <span className="font-semibold text-ink">{makeShortNumber(followerCount)}</span>
          <span className="text-ink-3"> Followers</span>
        </a>
      </Link>
      {hitRatePct != null && (
        <span title="Polymarket resolved positions">
          <span className="font-semibold text-ink">{hitRatePct}%</span>
          <span className="text-ink-3"> Hit rate</span>
        </span>
      )}
    </div>
  );
}

function ProfileStatsRow({ username, isSelf }: { username: string; isSelf: boolean }) {
  const accuracy = useUserAccuracy(username);

  // Hidden until accuracy is loaded; render nothing if accuracy is
  // private AND not self (no stats to show, no point in skeletons).
  if (accuracy.isLoading) return null;
  const visible = accuracy.data?.visible;
  if (!visible && !isSelf) return null;
  const stats = accuracy.data?.stats;

  // Self with no data yet — render the "link a wallet" nudge in
  // place of the stats row so the screen stays visually anchored.
  if (!stats || stats.resolvedPositions === 0) {
    if (!isSelf) return null;
    return (
      <div className="px-5 mb-4">
        <Link href={APP.SETTINGS.WALLET}>
          <a
            className="
              block rounded-[14px] border border-line bg-surface
              px-4 py-3 text-[13px] text-ink-3
              hover:border-brand-2/50 hover:bg-hover
              transition-colors duration-150
            "
          >
            No resolved positions yet. Link a Polymarket wallet in
            <span className="text-brand-2"> Settings → Wallet </span>
            to build your stats.
          </a>
        </Link>
      </div>
    );
  }

  // Reputation tier derived from rankingScore band. Bands are
  // intentionally loose for now — re-tune once we have a population
  // distribution to anchor on.
  const tier = rankingTier(stats.rankingScore);
  const accuracyPct = stats.accuracy != null ? Math.round((stats.accuracy as number) * 100) : null;

  return (
    <div className="mx-5 mb-4 grid grid-cols-4 gap-[1px] rounded-[14px] overflow-hidden bg-line">
      <StatCell label="Calls" value={String(stats.resolvedPositions)} sub="resolved" />
      <StatCell
        label="Hit rate"
        value={accuracyPct != null ? `${accuracyPct}%` : '—'}
        sub={`${stats.correctPositions}/${stats.resolvedPositions}`}
        tone={accuracyPct != null && accuracyPct >= 50 ? 'up' : undefined}
      />
      <StatCell
        label="Brier"
        value={stats.weightedBrierScore != null ? stats.weightedBrierScore.toFixed(3) : '—'}
        sub="lower is better"
      />
      <StatCell
        label="Reputation"
        value={tier.label}
        sub={tier.sub}
        tone={tier.tone}
      />
    </div>
  );
}

function StatCell({
  label, value, sub, tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: 'up' | 'down' | 'gold';
}) {
  let valueClass = 'text-ink';
  if (tone === 'up') valueClass = 'text-green-2';
  if (tone === 'down') valueClass = 'text-pink-2';
  if (tone === 'gold') valueClass = 'text-gold';
  return (
    <div className="bg-canvas px-4 py-3 flex flex-col gap-1">
      <div className="text-[10px] uppercase tracking-[0.08em] text-ink-3 font-mono">
        {label}
      </div>
      <div className={`text-[20px] font-mono font-semibold ${valueClass}`}>
        {value}
      </div>
      <div className="text-[11px] text-ink-3 font-mono truncate">
        {sub}
      </div>
    </div>
  );
}

const PROFILE_TABS: { key: ProfileTab; label: string }[] = [
  { key: 'posts', label: 'Posts' },
  { key: 'replies', label: 'Replies' },
  { key: 'media', label: 'Media' },
  { key: 'likes', label: 'Likes' },
];

function ProfileTabsBar({
  active, onChange,
}: { active: ProfileTab; onChange: (t: ProfileTab) => void }) {
  return (
    <div className="border-t border-b border-line bg-canvas">
      <div className="flex items-center gap-1 px-5 -mx-1">
        {PROFILE_TABS.map((t) => {
          const isActive = t.key === active;
          return (
            <button
              type="button"
              key={t.key}
              onClick={() => onChange(t.key)}
              className={[
                'relative px-3 py-3 text-[14px] font-medium tracking-[-0.005em]',
                'transition-colors duration-150',
                isActive ? 'text-ink' : 'text-ink-2 hover:text-ink',
              ].join(' ')}
            >
              <span>{t.label}</span>
              {isActive && (
                <span className="absolute left-2 right-2 -bottom-px h-[3px] rounded-full bg-brand-2" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProfileTabContent({
  tab, items,
}: { tab: ProfileTab; items: any[] | undefined }) {
  if (items === undefined) {
    return (
      <div className="flex justify-center py-10">
        <Loading type="bubbles" color="#7B4CFF" height={32} width={32} />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="px-5 py-12 text-center text-ink-3 text-[13px]">
        {tab === 'posts' && 'No posts yet.'}
        {tab === 'replies' && 'No replies yet.'}
        {tab === 'media' && 'No media yet.'}
        {tab === 'likes' && 'No likes yet.'}
      </div>
    );
  }
  if (tab === 'replies') {
    return (
      <div>
        {items.map((c: any) => (
          <ProfileReplyCard key={c.id?.toString()} comment={c} />
        ))}
      </div>
    );
  }
  return (
    <div>
      {items.map((p: Post) => (
        <NewPost key={p.id?.toString()} post={p} />
      ))}
    </div>
  );
}

function formatJoined(createdAt?: Date | string): string | null {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

// Hover label for the verified badge. We don't track a separate
// verification timestamp yet, so the "since" date is the account
// createdAt — a reasonable approximation for our current cohort. If
// we can't format the date, fall back to the bare label.
function verifiedTooltip(isOrg: boolean, createdAt?: Date | string): string {
  const label = isOrg ? 'Verified organization' : 'Verified person';
  const since = formatJoined(createdAt);
  return since ? `${label} since ${since}` : label;
}

function rankingTier(score: number): { label: string; sub: string; tone: 'gold' | 'up' | 'down' | undefined } {
  // Bands are loose placeholders — recalibrate once there's a
  // population distribution to anchor on.
  if (score >= 0.8) return { label: 'A+', sub: 'oracle tier', tone: 'gold' };
  if (score >= 0.6) return { label: 'A', sub: 'top trader', tone: 'up' };
  if (score >= 0.4) return { label: 'B', sub: 'building', tone: undefined };
  if (score > 0)    return { label: 'C', sub: 'building', tone: undefined };
  return { label: '—', sub: 'no signal yet', tone: undefined };
}

export default NewProfileScreen;
