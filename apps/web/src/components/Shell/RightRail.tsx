// Right rail (360px) — desktop only. Stack of cards:
//   1. Search bar         — UI only (typeahead route TBD)
//   2. Trending markets   — REAL: top 5 by closesAt soon
//   3. Top traders        — REAL: /api/users/leaderboard (publicAccuracy)
//   4. Communities        — REAL: /api/communities/trending (member count)
//
// Trending tags card removed — we don't have a real signal source for
// it yet, so showing fake tags would mislead. Add back when we ship
// real tag tracking.
//
// Each card has its own honest empty state when its endpoint returns
// nothing (no fake placeholder data).

import React from 'react';
import { useQuery } from 'react-query';
import Link from 'next/link';
import type { Media } from '@prisma/client';

import axios from '@src/lib/axios';
import useMedia from '@src/hooks/useMedia';

import { ShellIcons as I } from './icons';

type MarketLite = {
  id: string;
  question: string;
  category?: string | null;
  imageUrl?: string | null;
  closesAt: string;
  outcomes: Array<{ label: string; lastPrice: string | null }>;
};

type LeaderRow = {
  rank: number;
  userId: string;
  username: string;
  name: string;
  // Media row — resolved client-side via useMedia. host is a
  // StorageLocation enum (R2, FIREBASE, etc.), so we can't build the
  // URL on the server without coupling to storage drivers.
  avatar: Media | null;
  resolvedPositions: number;
  correctPositions: number;
  accuracyPct: number;
  rankingScore: string;
};

type TrendingCommunity = {
  id: string;
  uuid: string;
  name: string;
  description: string;
  avatar: Media | null;
  memberCount: number;
};

async function fetchTrendingMarkets(): Promise<MarketLite[]> {
  const { data } = await axios().get<MarketLite[]>('/markets?limit=5');
  return data ?? [];
}

async function fetchLeaderboard(): Promise<LeaderRow[]> {
  const { data } = await axios().get<LeaderRow[]>('/users/leaderboard?limit=4');
  return data ?? [];
}

async function fetchTrendingCommunities(): Promise<TrendingCommunity[]> {
  const { data } = await axios().get<TrendingCommunity[]>('/communities/trending?limit=4');
  return data ?? [];
}

const RightRail: React.FC = () => {
  const markets = useQuery(['trending-markets'], fetchTrendingMarkets, {
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const leaders = useQuery(['top-traders'], fetchLeaderboard, {
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  });
  const communities = useQuery(['trending-communities'], fetchTrendingCommunities, {
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
  });

  return (
    <aside
      className="
        sticky top-0 h-screen overflow-y-auto
        border-l border-line bg-canvas
        flex flex-col gap-3
        px-4 py-4
        font-display
      "
    >
      <SearchBar />

      <RailCard title="Trending markets" cta="See all →" ctaHref="/markets">
        {markets.isLoading && <Placeholder text="Loading…" />}
        {markets.data?.slice(0, 5).map((m) => (
          <TrendingMarketRow key={m.id} market={m} />
        ))}
        {markets.data && markets.data.length === 0 && (
          <Placeholder text="No active markets yet." />
        )}
      </RailCard>

      <RailCard title="Top traders" cta="Leaderboard →">
        {leaders.isLoading && <Placeholder text="Loading…" />}
        {leaders.data?.map((t) => <LeaderboardRow key={t.userId} {...t} />)}
        {leaders.data && leaders.data.length === 0 && (
          <Placeholder text="Leaderboard fills as accuracy resolves on settled positions." />
        )}
      </RailCard>

      <RailCard title="Communities to join" cta="Explore →" ctaHref="/community">
        {communities.isLoading && <Placeholder text="Loading…" />}
        {communities.data?.map((c) => <CommunityRow key={c.id} community={c} />)}
        {communities.data && communities.data.length === 0 && (
          <Placeholder text="No public communities yet." />
        )}
      </RailCard>
    </aside>
  );
};

function SearchBar() {
  return (
    <div className="relative">
      <I.search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3" />
      <input
        placeholder="Search markets, handles, communities"
        className="
          w-full h-10 pl-10 pr-4 rounded-full
          bg-surface border border-line
          text-[14px] text-ink placeholder:text-ink-3
          outline-none focus:border-line-2
          transition-colors duration-150
          font-display
        "
      />
    </div>
  );
}

function RailCard({
  title,
  cta,
  ctaHref,
  children,
}: {
  title: string;
  cta?: string;
  ctaHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-line rounded-[14px] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="m-0 text-[14px] font-semibold tracking-[-0.005em] text-ink">
          {title}
        </h3>
        {cta && (
          ctaHref ? (
            <Link href={ctaHref}>
              <span className="text-[11px] font-mono text-brand-2 cursor-pointer hover:underline">
                {cta}
              </span>
            </Link>
          ) : (
            <span className="text-[11px] font-mono text-brand-2 cursor-pointer">
              {cta}
            </span>
          )
        )}
      </div>
      {children}
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return <div className="px-1 py-2 text-[12px] text-ink-3">{text}</div>;
}

function TrendingMarketRow({ market }: { market: MarketLite }) {
  // Binary markets have a YES outcome with lastPrice ∈ [0,1].
  // Multi-outcome markets pick the leading outcome for the rail.
  const top = market.outcomes
    .filter((o) => o.lastPrice != null)
    .map((o) => ({ ...o, p: parseFloat(o.lastPrice as string) }))
    .sort((a, b) => b.p - a.p)[0];
  const pct = top ? Math.round(top.p * 100) : null;
  const closes = new Date(market.closesAt);
  const closesLabel = `${closes.toLocaleString(undefined, { month: 'short', day: 'numeric' })}`;
  const thumb = thumbFor(market.category);

  return (
    <Link href="/markets">
      <div className="flex items-center gap-3 cursor-pointer py-1.5 hover:bg-hover -mx-2 px-2 rounded-lg transition-colors">
        <div className="w-9 h-9 rounded-[7px] bg-surface-2 border border-line flex-none overflow-hidden">
          {thumb && <img src={thumb} alt="" className="w-full h-full object-cover" />}
          {market.imageUrl && !thumb && (
            <img src={market.imageUrl} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <div className="text-[10px] uppercase tracking-[0.06em] text-ink-3 font-mono truncate">
            {(market.category ?? 'Market')} · resolves {closesLabel}
          </div>
          <div className="text-[13px] font-medium text-ink line-clamp-2 leading-tight">
            {market.question}
          </div>
        </div>
        {pct != null && (
          <div className="flex-none text-right">
            <div className="text-[14px] font-mono font-semibold text-ink">{pct}%</div>
          </div>
        )}
      </div>
    </Link>
  );
}

function LeaderboardRow({
  rank, name, username, avatar, accuracyPct, resolvedPositions,
}: LeaderRow) {
  const avatarUrl = useMedia(avatar);
  const accent =
    rank === 1 ? 'text-gold' : rank === 2 ? 'text-ink-2' : 'text-ink-3';
  return (
    <Link href={`/${username}`}>
      <div className="flex items-center gap-3 py-1.5 cursor-pointer hover:bg-hover -mx-2 px-2 rounded-lg transition-colors">
        <span className={['text-[12px] font-mono w-7 text-center', accent].join(' ')}>
          #{rank}
        </span>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-9 h-9 rounded-full flex-none object-cover"
          />
        ) : (
          <div
            className="w-9 h-9 rounded-full flex-none"
            style={{ background: 'linear-gradient(135deg,#5822FB,#FF8800)' }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-ink truncate">{name}</div>
          <div className="text-[11px] text-ink-3 font-mono truncate">
            @{username} · {resolvedPositions} resolved
          </div>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-mono font-semibold text-green-2">
            {accuracyPct}%
          </div>
          <div className="text-[10px] text-ink-3 font-mono">accuracy</div>
        </div>
      </div>
    </Link>
  );
}

function CommunityRow({ community }: { community: TrendingCommunity }) {
  const avatarUrl = useMedia(community.avatar);
  return (
    <Link href={`/community/${community.uuid}`}>
      <div className="flex items-center gap-3 py-1.5 cursor-pointer hover:bg-hover -mx-2 px-2 rounded-lg transition-colors">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-8 h-8 rounded-[7px] flex-none object-cover"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-[7px] flex-none"
            style={{ background: 'linear-gradient(135deg,#5822FB,#FF8800)' }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-ink truncate">{community.name}</div>
          <div className="text-[11px] text-ink-3 font-mono truncate">
            {community.memberCount} {community.memberCount === 1 ? 'member' : 'members'}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Map a market's category label to a stock thumbnail. Falls back to
// the category-less surface — markets without a category just don't
// get a thumb.
function thumbFor(category?: string | null): string | null {
  if (!category) return null;
  const c = category.toLowerCase();
  if (c.includes('crypto') || c.includes('btc')) return '/webui/thumbs/btcusd.png';
  if (c.includes('tech') || c.includes('ai')) return '/webui/thumbs/ai.png';
  if (c.includes('macro') || c.includes('fed')) return '/webui/thumbs/fed.png';
  if (c.includes('politic')) return '/webui/thumbs/politics.png';
  if (c.includes('geopol') || c.includes('war')) return '/webui/thumbs/geopolitics.png';
  if (c.includes('energy')) return '/webui/thumbs/energy.png';
  if (c.includes('defense')) return '/webui/thumbs/defense.png';
  if (c.includes('culture')) return '/webui/thumbs/culture.png';
  return null;
}

export default RightRail;
