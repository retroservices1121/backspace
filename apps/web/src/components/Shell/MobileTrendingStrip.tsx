// Mobile-only horizontal carousel of trending markets, shown at the
// top of the feed (< sm). Translated from the Backspace_Mobile_App
// prototype's `.trending-strip`. Pulls the SAME live data as the
// desktop RightRail "Trending markets" card (/markets?limit=5) so the
// two surfaces never disagree.

import React from 'react';
import { useQuery } from 'react-query';
import Link from 'next/link';

import axios from '@src/lib/axios';

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

// Mirror of RightRail.thumbFor — kept local so the mobile strip stays
// self-contained. If this drifts, reconcile both.
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

const MobileTrendingStrip: React.FC = () => {
  const markets = useQuery(['trending-markets'], fetchTrendingMarkets, {
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // No card while loading or when there are no active markets — the
  // feed shouldn't show an empty band.
  if (!markets.data || markets.data.length === 0) return null;

  return (
    <section className="sm:hidden border-b border-line py-3.5 font-display">
      <div className="px-4 pb-2 flex items-center gap-1.5">
        <span className="inline-flex w-1.5 h-1.5 rounded-full bg-green-2 shadow-[0_0_0_3px_rgba(14,173,105,0.22)]" />
        <span className="text-[10.5px] font-mono uppercase tracking-[0.16em] text-ink-3 font-semibold">
          Trending now
        </span>
      </div>
      <div
        className="flex gap-2.5 px-4 overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
      >
        {markets.data.slice(0, 6).map((m) => (
          <TrendingCard key={m.id} market={m} />
        ))}
      </div>
    </section>
  );
};

function TrendingCard({ market }: { market: MarketLite }) {
  const top = market.outcomes
    .filter((o) => o.lastPrice != null)
    .map((o) => ({ ...o, p: parseFloat(o.lastPrice as string) }))
    .sort((a, b) => b.p - a.p)[0];
  const pct = top ? Math.round(top.p * 100) : null;
  const closes = new Date(market.closesAt);
  const closesLabel = closes.toLocaleString(undefined, { month: 'short', day: 'numeric' });
  const thumb = thumbFor(market.category);

  return (
    <Link href="/markets">
      <a className="flex-none w-[180px] bg-surface border border-line rounded-[12px] p-3 flex flex-col gap-2 cursor-pointer">
        <div className="flex items-center gap-2">
          <div className="w-[30px] h-[30px] rounded-[7px] overflow-hidden flex-none bg-surface-2 border border-line">
            {thumb ? (
              <img src={thumb} alt="" className="w-full h-full object-cover" />
            ) : market.imageUrl ? (
              <img src={market.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : null}
          </div>
          <span className="text-[9.5px] font-mono uppercase tracking-[0.08em] text-ink-3 truncate">
            {(market.category ?? 'Market')} · {closesLabel}
          </span>
        </div>
        <div className="text-[12.5px] font-medium leading-[1.3] text-ink line-clamp-2">
          {market.question}
        </div>
        <div className="flex items-baseline justify-between mt-auto pt-0.5">
          {pct != null && (
            <span className="text-[18px] font-mono font-semibold text-ink tracking-[-0.01em]">
              {pct}%
            </span>
          )}
        </div>
      </a>
    </Link>
  );
}

export default MobileTrendingStrip;
