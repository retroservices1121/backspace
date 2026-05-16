// Right rail (360px) — desktop only. Stack of cards from the design:
//   1. Search bar         — UI only (typeahead route TBD)
//   2. Trending markets   — REAL: top 5 active markets (soonest-closing)
//   3. Top traders        — STUB sample data, "Coming soon" footer
//   4. Communities        — STUB
//   5. Trending tags      — STUB
//
// Real-data sources are kept narrow (one query, one widget) so we
// don't pull more than the rail needs.

import React from 'react';
import { useQuery } from 'react-query';
import Link from 'next/link';

import axios from '@src/lib/axios';

import { ShellIcons as I } from './icons';

type MarketLite = {
  id: string;
  question: string;
  category?: string | null;
  imageUrl?: string | null;
  closesAt: string;
  outcomes: Array<{ label: string; lastPrice: string | null }>;
};

async function fetchTrendingMarkets(): Promise<MarketLite[]> {
  const { data } = await axios().get<MarketLite[]>('/markets?limit=5');
  return data ?? [];
}

const RightRail: React.FC = () => {
  const markets = useQuery(['trending-markets'], fetchTrendingMarkets, {
    refetchInterval: 60_000,
    staleTime: 30_000,
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

      <RailCard title="Trending markets" cta="See all →" ctaHref="/discover">
        {markets.isLoading && (
          <div className="px-1 py-2 text-[12px] text-ink-3">Loading…</div>
        )}
        {markets.data?.slice(0, 5).map((m) => (
          <TrendingMarketRow key={m.id} market={m} />
        ))}
        {markets.data && markets.data.length === 0 && (
          <div className="px-1 py-2 text-[12px] text-ink-3">
            No active markets yet.
          </div>
        )}
      </RailCard>

      <RailCard title="Top traders · this week" cta="Leaderboard →">
        {SAMPLE_TRADERS.map((t) => (
          <LeaderboardRow key={t.handle} {...t} />
        ))}
        <ComingSoonNote text="Leaderboard launches with the next accuracy snapshot." />
      </RailCard>

      <RailCard title="Communities to join" cta="Explore →">
        {SAMPLE_COMMUNITIES.map((c) => (
          <CommunityRow key={c.name} {...c} />
        ))}
        <ComingSoonNote text="Recommendations roll out as community signals stabilize." />
      </RailCard>

      <RailCard title="Trending tags">
        <div className="flex flex-col gap-3">
          {SAMPLE_TAGS.map((t) => (
            <div key={t.name} className="flex flex-col gap-0.5">
              <div className="text-[10px] uppercase tracking-[0.06em] text-ink-3 font-mono">
                {t.type}
              </div>
              <div className="text-[14px] font-semibold text-ink">{t.name}</div>
              <div className="text-[11px] text-ink-3 font-mono">{t.sub}</div>
            </div>
          ))}
        </div>
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
    <Link href="/discover">
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
  rank, name, handle, pnl, wins, accent,
}: typeof SAMPLE_TRADERS[number]) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span
        className={[
          'text-[12px] font-mono w-7 text-center',
          accent === 'gold' ? 'text-gold' : accent === 'silver' ? 'text-ink-2' : 'text-ink-3',
        ].join(' ')}
      >
        #{rank}
      </span>
      <div
        className="w-9 h-9 rounded-full flex-none"
        style={{ background: 'linear-gradient(135deg,#5822FB,#FF8800)' }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-ink truncate">{name}</div>
        <div className="text-[11px] text-ink-3 font-mono truncate">
          {handle} · {wins}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[13px] font-mono font-semibold text-green-2">{pnl}</div>
        <div className="text-[10px] text-ink-3 font-mono">7d P&amp;L</div>
      </div>
    </div>
  );
}

function CommunityRow({ name, sub, color }: typeof SAMPLE_COMMUNITIES[number]) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div
        className="w-8 h-8 rounded-[7px] flex-none"
        style={{ background: color }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-ink truncate">{name}</div>
        <div className="text-[11px] text-ink-3 font-mono truncate">{sub}</div>
      </div>
      <button
        type="button"
        className="
          px-3 py-1 rounded-full text-[12px] font-semibold
          bg-ink text-canvas hover:opacity-90 transition-opacity
        "
      >
        Join
      </button>
    </div>
  );
}

function ComingSoonNote({ text }: { text: string }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.06em] text-ink-4 font-mono pt-2 border-t border-line">
      {text}
    </div>
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

// Sample data — replaces real backend when one ships. Worth keeping
// thin so the visual lands without faking volume on the page.
const SAMPLE_TRADERS = [
  { rank: 1, name: 'venn',      handle: '@venn',      pnl: '+184.2k', wins: '74% W', accent: 'gold' as const },
  { rank: 2, name: 'ck',        handle: '@ck',        pnl: '+126.8k', wins: '68% W', accent: 'silver' as const },
  { rank: 3, name: 'macro_dad', handle: '@macro_dad', pnl: '+98.3k',  wins: '62% W', accent: null as null },
  { rank: 4, name: '0xfeline',  handle: '@0xfeline',  pnl: '+71.0k',  wins: '58% W', accent: null as null },
];

const SAMPLE_COMMUNITIES = [
  { name: 'Degenerates', sub: '12.4k members · 240/day', color: '#ff5470' },
  { name: 'Macro Heads', sub: '8.2k members · 90/day',   color: '#1C70F5' },
  { name: 'Onchain',     sub: '22.1k members · 410/day', color: '#FFB44C' },
];

const SAMPLE_TAGS = [
  { type: 'Topic · in markets', name: '$ETH spot ETF', sub: '312 markets · $4.1M volume' },
  { type: 'Trending · 1h',      name: '#OpenAIIPO',    sub: '8.4k posts' },
  { type: 'Topic · in markets', name: '$SOL',          sub: '198 markets · $2.7M volume' },
];

export default RightRail;
