import React, { useState } from 'react';
import { useRouter } from 'next/router';

import type { MarketEventGroup } from '@src/lib/markets/groupEvents';

import type { MarketCardData } from './MarketCard';

type Props = {
  event: MarketEventGroup<MarketCardData>;
};

function cents(price?: string | null): string {
  const value = Number(price);
  return Number.isFinite(value) ? `${Math.round(value * 100)}¢` : '—';
}

function volumeLabel(markets: MarketCardData[]): string | null {
  const total = markets.reduce((sum, market) => {
    const value = Number(market.volume24hUsd ?? market.volumeUsd ?? 0);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);
  if (total <= 0) return null;
  if (total >= 1_000_000) return `$${(total / 1_000_000).toFixed(1)}M`;
  if (total >= 1_000) return `$${(total / 1_000).toFixed(0)}K`;
  return `$${total.toFixed(0)}`;
}

export function MarketEventCard({ event }: Props) {
  const router = useRouter();
  const lead = event.markets[0];
  const aggregateVolume = volumeLabel(event.markets);
  const isMultiMarket = event.markets.length > 1;
  const [expanded, setExpanded] = useState(false);
  const displayedMarkets = expanded ? event.markets : event.markets.slice(0, 4);

  if (!isMultiMarket) {
    // Single-market events keep the existing compact card elsewhere. This
    // branch is intentionally handled by the caller.
    return null;
  }

  return (
    <article className="flex min-h-full flex-col overflow-hidden rounded-[16px] border border-line bg-surface font-display text-ink transition-colors hover:border-brand-2/50">
      <div className="relative aspect-[16/7] w-full overflow-hidden bg-canvas/60">
        {lead.imageUrl ? (
          <img src={lead.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-2/40 to-orange-500/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-canvas/90 via-canvas/20 to-transparent" />
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
          <span className="rounded-full border border-white/15 bg-canvas/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.06em] backdrop-blur-sm">
            {lead.category || 'Event'}
          </span>
          <span className="rounded-full border border-brand-2/30 bg-brand-soft px-2 py-1 font-mono text-[10px] font-semibold text-brand-2">
            {event.markets.length} markets
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="m-0 mb-3 text-[15px] font-bold leading-snug tracking-[-0.01em] line-clamp-2">
          {event.title}
        </h3>

        <div className="flex flex-col gap-1.5">
          {displayedMarkets.map((market) => {
            const leader = [...market.outcomes]
              .filter((outcome) => outcome.lastPrice != null)
              .sort((a, b) => Number(b.lastPrice) - Number(a.lastPrice))[0];
            return (
              <button
                key={market.id}
                type="button"
                onClick={() => router.push(`/m/${market.id}`)}
                className="group/row flex w-full items-center gap-3 rounded-[10px] border border-line bg-canvas/35 px-3 py-2.5 text-left transition-colors hover:border-brand-2/45 hover:bg-brand-soft"
              >
                <span className="min-w-0 flex-1 text-[12.5px] font-medium leading-snug text-ink-2 line-clamp-2 group-hover/row:text-ink">
                  {market.question}
                </span>
                <span className="flex-none text-right">
                  <span className="block font-mono text-[13px] font-bold text-green-2">
                    {cents(leader?.lastPrice)}
                  </span>
                  <span className="block max-w-[70px] truncate text-[9px] uppercase tracking-[0.04em] text-ink-3">
                    {leader?.label || 'Open'}
                  </span>
                </span>
                <span className="text-brand-2" aria-hidden="true">→</span>
              </button>
            );
          })}
          {event.markets.length > 4 && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="rounded-[9px] px-3 py-2 text-left text-[11.5px] font-semibold text-brand-2 transition-colors hover:bg-brand-soft"
            >
              {expanded ? 'Show fewer markets' : `View ${event.markets.length - 4} more markets`}
            </button>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-3 font-mono text-[10.5px] text-ink-3">
          <span>{aggregateVolume ? `${aggregateVolume} 24h volume` : 'Live event'}</span>
          <span>Select a market</span>
        </div>
      </div>
    </article>
  );
}
