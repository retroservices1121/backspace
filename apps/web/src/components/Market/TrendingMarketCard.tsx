// Compact horizontal-scroller card used at the top of /markets. Designed
// to be smaller and more visual than the row-shape CatalogMarketCard —
// imagery anchors it, the leading outcome's probability is the headline
// number, and clicking the card opens the market detail route.
//
// This isn't a tradeable widget — the user trades from /m/[id] or from
// inline posts. Keeping the trending card non-interactive lets the
// horizontal scroller stay light (no live-price subscriptions per card).

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

export function TrendingMarketCard({ market }: Props) {
  const router = useRouter();
  const leading = [...market.outcomes]
    .filter((o) => o.lastPrice != null)
    .sort(
      (a, b) =>
        Number.parseFloat(b.lastPrice ?? '0') - Number.parseFloat(a.lastPrice ?? '0'),
    )[0] ?? market.outcomes[0];
  const leadingPct =
    leading?.lastPrice != null
      ? Math.round(Number.parseFloat(leading.lastPrice) * 100)
      : null;

  const closes = timeUntilLabel(market.closesAt);
  const volume = fmtVolume(market.volume24hUsd) ?? fmtVolume(market.volumeUsd);

  return (
    <button
      type="button"
      onClick={() => router.push(`/m/${market.id}`)}
      className="
        relative flex-none w-[260px] h-[160px]
        rounded-[16px] overflow-hidden
        border border-line bg-surface
        text-left font-display text-ink
        hover:border-brand-2/50 transition-colors duration-150
        group
      "
    >
      {/* Background image. The image is darkened by an inset gradient
          so the question + price remain legible regardless of color. */}
      {market.imageUrl ? (
        <img
          src={market.imageUrl}
          alt=""
          className="
            absolute inset-0 w-full h-full object-cover
            opacity-90 group-hover:opacity-100 transition-opacity
          "
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(88,34,251,0.45) 0%, rgba(255,136,0,0.30) 100%)',
          }}
        />
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(15,13,26,0) 35%, rgba(15,13,26,0.85) 100%)',
        }}
      />

      {/* Top row — category chip + time-to-close */}
      <div className="relative px-3 pt-2.5 flex items-center justify-between">
        {market.category ? (
          <span className="
            text-[10px] font-mono uppercase tracking-[0.06em]
            text-ink/90 bg-canvas/60 backdrop-blur-sm
            px-2 py-0.5 rounded-full border border-line
          ">
            {market.category}
          </span>
        ) : <span />}
        <span className="
          text-[10px] font-mono uppercase tracking-[0.06em]
          text-ink/90 bg-canvas/60 backdrop-blur-sm
          px-2 py-0.5 rounded-full border border-line
        ">
          {closes}
        </span>
      </div>

      {/* Bottom block — question + leading probability + volume */}
      <div className="absolute left-0 right-0 bottom-0 p-3 flex items-end gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold leading-snug text-ink line-clamp-2">
            {market.question}
          </div>
          {volume && (
            <div className="mt-1 text-[10.5px] font-mono text-ink-3">
              {volume} · 24h
            </div>
          )}
        </div>
        {leadingPct != null && (
          <div className="flex-none text-right">
            <div className="text-[22px] font-mono font-bold text-ink tabular-nums leading-none">
              {leadingPct}%
            </div>
            {leading?.label && (
              <div className="mt-0.5 text-[10px] font-mono text-ink-3 truncate max-w-[90px]">
                {leading.label}
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
