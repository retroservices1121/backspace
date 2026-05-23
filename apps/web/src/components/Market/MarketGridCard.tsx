// Vertical grid tile for the /markets discover grid. Read-only — the
// whole tile is a button that routes to /m/[id] where the user can
// actually trade. Modeled on polymarket.com's discover grid: image on
// the top half, question below, YES/NO cents on the bottom row, with
// a small footer for 24h volume + time-until-close.
//
// Separate from TrendingMarketCard (which overlays text on the image
// for a tight horizontal-scroll tile) because the grid card has more
// vertical room to spend — surfacing both outcome prices side-by-side
// is the most useful headline at this size, not just the leading one.

import React from 'react';
import { useRouter } from 'next/router';

import type { MarketCardData } from './MarketCard';

type Props = {
  market: MarketCardData;
};

function timeUntilLabel(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  const ms = date.getTime() - Date.now();
  if (!Number.isFinite(ms)) return '—';
  if (ms <= 0) return 'Closed';
  const days = Math.floor(ms / 86_400_000);
  if (days >= 30) return `${Math.floor(days / 30)}mo`;
  if (days >= 1) return `${days}d`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours}h`;
  const minutes = Math.floor(ms / 60_000);
  return `${minutes}m`;
}

function fmtVolume(usd?: string | null): string | null {
  if (!usd) return null;
  const n = Number.parseFloat(usd);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function centsOf(price?: string | null): number | null {
  if (!price) return null;
  const n = Number.parseFloat(price);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export function MarketGridCard({ market }: Props) {
  const router = useRouter();
  const closes = timeUntilLabel(market.closesAt);
  const volume = fmtVolume(market.volume24hUsd) ?? fmtVolume(market.volumeUsd);

  // Pick the top two outcomes by lastPrice — for binary markets that's
  // YES + NO; for multi-outcome it's the two leading options. The card
  // is intentionally a teaser, not a complete ladder — the detail page
  // shows the full list.
  const ranked = [...market.outcomes]
    .filter((o) => o.lastPrice != null)
    .sort(
      (a, b) =>
        Number.parseFloat(b.lastPrice ?? '0') - Number.parseFloat(a.lastPrice ?? '0'),
    );
  const first = ranked[0];
  const second = ranked[1];
  const firstCents = centsOf(first?.lastPrice ?? null);
  const secondCents = centsOf(second?.lastPrice ?? null);

  return (
    <button
      type="button"
      onClick={() => router.push(`/m/${market.id}`)}
      className="
        flex flex-col w-full
        rounded-[16px] overflow-hidden
        border border-line bg-surface
        text-left font-display text-ink
        hover:border-brand-2/50 transition-colors duration-150
        group
      "
    >
      {/* Image header — fills width, fixed aspect so rows align. */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-canvas/60">
        {market.imageUrl ? (
          <img
            src={market.imageUrl}
            alt=""
            className="
              absolute inset-0 w-full h-full object-cover
              opacity-95 group-hover:opacity-100 transition-opacity
            "
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(88,34,251,0.40) 0%, rgba(255,136,0,0.25) 100%)',
            }}
          />
        )}
        {/* Subtle bottom shade so the optional chip stays legible. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(15,13,26,0) 55%, rgba(15,13,26,0.45) 100%)',
          }}
        />
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
          {market.category ? (
            <span className="
              text-[10px] font-mono uppercase tracking-[0.06em]
              text-ink/90 bg-canvas/70 backdrop-blur-sm
              px-2 py-0.5 rounded-full border border-line
            ">
              {market.category}
            </span>
          ) : <span />}
          <span className="
            text-[10px] font-mono uppercase tracking-[0.06em]
            text-ink/90 bg-canvas/70 backdrop-blur-sm
            px-2 py-0.5 rounded-full border border-line
          ">
            {closes}
          </span>
        </div>
      </div>

      {/* Body — question + outcome row + footer. Flex column with grow
          on the question line so cards align nicely in a uniform grid
          even when questions wrap to a different number of lines. */}
      <div className="flex flex-col gap-3 p-3.5 flex-1">
        <div className="text-[14px] font-semibold leading-snug text-ink line-clamp-3 flex-1">
          {market.question}
        </div>

        {(firstCents != null || secondCents != null) && (
          <div className="flex items-center gap-2">
            {firstCents != null && (
              <OutcomeChip label={first?.label ?? '—'} cents={firstCents} tone="up" />
            )}
            {secondCents != null && (
              <OutcomeChip label={second?.label ?? '—'} cents={secondCents} tone="down" />
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] font-mono text-ink-3">
          <span>{volume ? `${volume} vol` : ''}</span>
          <span>tap to trade →</span>
        </div>
      </div>
    </button>
  );
}

function OutcomeChip({
  label, cents, tone,
}: {
  label: string;
  cents: number;
  tone: 'up' | 'down';
}) {
  return (
    <div
      className={[
        'flex-1 flex items-center justify-between',
        'rounded-[10px] border px-2.5 py-1.5',
        tone === 'up'
          ? 'border-line bg-canvas/40'
          : 'border-line bg-canvas/40',
      ].join(' ')}
    >
      <span className="text-[12px] font-medium text-ink-2 truncate max-w-[80px]">
        {label}
      </span>
      <span className="text-[13px] font-mono font-bold text-ink tabular-nums">
        {cents}¢
      </span>
    </div>
  );
}
