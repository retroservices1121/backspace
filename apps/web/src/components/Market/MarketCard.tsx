// Inline tradeable market widget — drops into a feed post or a community
// channel. Reads VenueMarket-shaped data; the importer / API route is what
// translates DB rows into this shape so the UI never has to know about
// Prisma's Decimal vs the wire's string. See packages/markets/src/types.ts.

import { useState } from 'react';

export type MarketCardOutcome = {
  externalId: string;
  label: string;
  // 0..1 probability as a string ("0.62"). null when no recent print.
  lastPrice: string | null;
  lastPriceAt: Date | null;
};

export type MarketCardData = {
  // The DB Market.id (as a string) — distinct from externalId, which is
  // the venue's condition_id. Trade routes key on this.
  id: string;
  venue: 'POLYMARKET' | 'AZURO' | 'INTERNAL';
  externalId: string;
  question: string;
  category: string | null;
  imageUrl: string | null;
  // Polymarket negative-risk flag — needed per order at trade time.
  negRisk: boolean;
  closesAt: Date;
  outcomes: MarketCardOutcome[];
};

type Side = 'BUY' | 'SELL';

type Props = {
  market: MarketCardData;
  walletConnected: boolean;
  walletBalanceUsd: string | null;
  // Real impl will dispatch through @backspace/markets quote() then submit()
  onTrade?: (intent: {
    outcomeExternalId: string;
    side: Side;
    shares: string;
  }) => Promise<void> | void;
  // Trade-gating UI injected by the connector (PostMarketCard /
  // CatalogMarketCard) — keeps MarketCard presentational and Privy-free.
  readinessSlot?: React.ReactNode;
};

function pct(p: string | null) {
  if (p === null) return '—';
  const n = Number(p);
  if (!Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(0)}%`;
}

function timeUntil(d: Date) {
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return 'closed';
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${days}d`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours}h`;
  const mins = Math.floor(ms / 60_000);
  return `${mins}m`;
}

export function MarketCard({
  market,
  walletConnected,
  walletBalanceUsd,
  onTrade,
  readinessSlot,
}: Props) {
  const [selectedOutcome, setSelectedOutcome] = useState(market.outcomes[0]?.externalId);
  const [side, setSide] = useState<Side>('BUY');
  const [shares, setShares] = useState('10');
  const [submitting, setSubmitting] = useState(false);

  const outcome = market.outcomes.find((o) => o.externalId === selectedOutcome);
  const price = outcome?.lastPrice ?? null;
  const numericShares = Number(shares) || 0;
  const numericPrice = price === null ? null : Number(price);
  const totalCost =
    numericPrice === null ? null : (numericShares * numericPrice).toFixed(2);
  const maxPayout = numericShares ? numericShares.toFixed(2) : '0.00';

  async function handleSubmit() {
    if (!outcome || !walletConnected || submitting) return;
    setSubmitting(true);
    try {
      await onTrade?.({
        outcomeExternalId: outcome.externalId,
        side,
        shares,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent">
      <div className="flex items-start gap-3 px-4 pt-4">
        {market.imageUrl && (
          <img
            src={market.imageUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/50">
            <span>{market.venue}</span>
            {market.category && (
              <>
                <span>·</span>
                <span>{market.category}</span>
              </>
            )}
            <span>·</span>
            <span>closes in {timeUntil(market.closesAt)}</span>
          </div>
          <h4 className="text-base font-semibold leading-snug text-white">
            {market.question}
          </h4>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 px-4">
        {market.outcomes.map((o) => {
          const active = o.externalId === selectedOutcome;
          return (
            <button
              key={o.externalId}
              onClick={() => setSelectedOutcome(o.externalId)}
              className={`flex flex-1 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition ${
                active
                  ? 'border-white/40 bg-white/10'
                  : 'border-white/10 bg-black/20 hover:border-white/20'
              }`}
            >
              <span className="text-sm font-medium text-white">{o.label}</span>
              <span className="text-sm font-mono tabular-nums text-white/80">
                {pct(o.lastPrice)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 px-4 pb-4">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-black/30 p-0.5">
            {(['BUY', 'SELL'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSide(s)}
                className={`rounded px-3 py-1 text-xs font-semibold transition ${
                  side === s
                    ? s === 'BUY'
                      ? 'bg-emerald-500/30 text-emerald-200'
                      : 'bg-rose-500/30 text-rose-200'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <input
            type="number"
            min="0"
            step="1"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            className="w-24 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm font-mono tabular-nums text-white placeholder-white/30 focus:border-white/30 focus:outline-none"
            placeholder="shares"
          />

          <div className="ml-auto text-right text-xs">
            <div className="text-white/50">cost</div>
            <div className="font-mono tabular-nums text-white">
              ${totalCost ?? '—'}
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-white/50">
          <span>
            {walletConnected
              ? `wallet: $${walletBalanceUsd ?? '0.00'}`
              : 'wallet not connected'}
          </span>
          <span>max payout: ${maxPayout}</span>
        </div>

        {readinessSlot}

        <button
          onClick={handleSubmit}
          disabled={!walletConnected || submitting || !outcome || numericShares <= 0}
          className={`mt-3 w-full rounded-xl py-2.5 text-sm font-semibold transition ${
            !walletConnected
              ? 'bg-white/5 text-white/40'
              : side === 'BUY'
                ? 'bg-emerald-500/80 text-black hover:bg-emerald-400'
                : 'bg-rose-500/80 text-white hover:bg-rose-400'
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {!walletConnected
            ? 'Connect wallet to trade'
            : submitting
              ? 'Submitting…'
              : `${side} ${numericShares || 0} shares of ${outcome?.label ?? '—'}`}
        </button>
      </div>
    </div>
  );
}
