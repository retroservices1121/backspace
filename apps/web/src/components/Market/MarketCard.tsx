// Inline tradeable market widget — drops into a feed post or a community
// channel. Reads VenueMarket-shaped data; the importer / API route is what
// translates DB rows into this shape so the UI never has to know about
// Prisma's Decimal vs the wire's string. See packages/markets/src/types.ts.
//
// Presentation matches the Backspace_Mobile_App prototype's `.m-embed`:
//   - Header: market glyph + question + meta (volume · closes) + Live pill
//   - Binary (2 outcomes): a single YES/NO probability bar + legend, then
//     two Buy buttons that open the inline trade row
//   - Multi-outcome: a ranked ladder (swatch + label + bar + price); a row
//     opens the trade row for that outcome
//   - Trade row (revealed on selection): BUY/SELL + USD amount + to-win +
//     confirm. Same onTrade/amount model as before — only the chrome moved.

import { useMemo, useState } from 'react';

import { ShellIcons as I } from 'components/Shell/icons';

// negRisk markets can carry 100+ outcomes; show the most-probable
// handful and tuck the rest behind a "more" toggle.
const OUTCOME_DISPLAY_CAP = 8;

// Swatch palette for the multi-outcome ladder, cycled by rank.
const SWATCHES = ['#FFB44C', '#1C70F5', '#0EAD69', '#FF8800', '#7B4CFF', '#ff5470', '#3BD691', '#cdbeff'];

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
  // Date over the wire is an ISO string (JSON has no Date type);
  // accept both so consumers don't have to remember to coerce.
  closesAt: Date | string;
  // Volume snapshots from the venue (USD). Strings to preserve
  // precision; null when the venue didn't report or the catalog
  // import predates the field.
  volumeUsd?: string | null;
  volume24hUsd?: string | null;
  liquidityUsd?: string | null;
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
    /** USD amount the user wants to spend (BUY) or cash out (SELL).
     *  String to preserve user-typed precision before validation. */
    usdAmount: string;
  }) => Promise<void> | void;
  // Trade-gating UI injected by the connector (PostMarketCard /
  // CatalogMarketCard) — keeps MarketCard presentational and Privy-free.
  readinessSlot?: React.ReactNode;
  // Live midpoint prices keyed by outcome externalId (the CLOB token
  // id), streamed from the market-channel websocket. When present for
  // an outcome it overrides the cron-cached lastPrice for display.
  livePrices?: Record<string, number | null>;
};

// Polymarket convention: outcome prices display as cents per share
// (0¢–100¢, summing to 100¢ across a binary market). The underlying
// CLOB price IS the cents value as a decimal — 0.96 = 96¢ = 96%
// probability = $0.96 you pay per share. Showing cents reinforces the
// "you're buying a $1 contract" mental model that probability never
// does.
function cents(p: string | number | null | undefined) {
  if (p == null) return '—';
  const n = Number(p);
  if (!Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(0)}¢`;
}

// Price as a 2-decimal dollar figure (0.62) for the Buy buttons.
function dollars(p: string | number | null | undefined) {
  if (p == null) return '—';
  const n = Number(p);
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(2);
}

function pct(p: string | number | null | undefined) {
  if (p == null) return null;
  const n = Number(p);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

function timeUntil(d: Date | string) {
  // Some callers (the catalog endpoint response) hand us an ISO string
  // because JSON doesn't preserve Date objects; coerce defensively so
  // d.getTime() doesn't blow up on the string path.
  const date = d instanceof Date ? d : new Date(d);
  const ms = date.getTime() - Date.now();
  if (!Number.isFinite(ms)) return '—';
  if (ms <= 0) return 'closed';
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${days}d`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours}h`;
  const mins = Math.floor(ms / 60_000);
  return `${mins}m`;
}

// Compact USD: 1_240_000 → "1.24M", 184_000 → "184K".
function usdShort(v?: string | null): string | null {
  if (v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${Math.round(n)}`;
}

export function MarketCard({
  market,
  walletConnected,
  walletBalanceUsd,
  onTrade,
  readinessSlot,
  livePrices,
}: Props) {
  const [selectedOutcome, setSelectedOutcome] = useState(market.outcomes[0]?.externalId);
  const [side, setSide] = useState<Side>('BUY');
  // The user enters a USD amount, Polymarket-style. Shares received +
  // max payout are derived from amount / price. Default $10 because
  // it's the rough minimum that produces a meaningful fill on most
  // markets without committing real capital on a first try.
  const [amount, setAmount] = useState('10');
  const [submitting, setSubmitting] = useState(false);
  const [showAllOutcomes, setShowAllOutcomes] = useState(false);
  // Trade row is revealed once the user picks a side/outcome — keeps the
  // embed compact in the feed until there's intent to trade.
  const [tradeOpen, setTradeOpen] = useState(false);

  // Most-probable outcome first. Sorted on the cached price (not the
  // live one) so the order stays stable as prices tick.
  const sortedOutcomes = useMemo(
    () =>
      [...market.outcomes].sort(
        (a, b) => Number(b.lastPrice ?? 0) - Number(a.lastPrice ?? 0),
      ),
    [market.outcomes],
  );
  const displayedOutcomes = showAllOutcomes
    ? sortedOutcomes
    : sortedOutcomes.slice(0, OUTCOME_DISPLAY_CAP);
  const hiddenOutcomeCount = sortedOutcomes.length - displayedOutcomes.length;

  const priceOf = (o?: MarketCardOutcome) =>
    o ? livePrices?.[o.externalId] ?? o.lastPrice ?? null : null;

  const outcome = market.outcomes.find((o) => o.externalId === selectedOutcome);
  // Prefer the live websocket midpoint; fall back to the cached price.
  const livePrice = outcome ? livePrices?.[outcome.externalId] ?? null : null;
  const price = livePrice ?? outcome?.lastPrice ?? null;
  const numericAmount = Number(amount) || 0;
  const numericPrice = price === null ? null : Number(price);
  // Shares this amount would buy at the displayed price. Each winning
  // share pays $1.00, so max payout in USD equals shares received.
  // Profit if right = maxPayout − amount.
  const estimatedShares =
    numericPrice && numericPrice > 0 ? numericAmount / numericPrice : null;
  const maxPayout = estimatedShares != null ? estimatedShares.toFixed(2) : '—';
  const profitToWin =
    estimatedShares != null ? (estimatedShares - numericAmount).toFixed(2) : '—';

  // Binary vs multi presentation.
  const isBinary = sortedOutcomes.length === 2;
  const topOutcome = sortedOutcomes[0];
  const secondOutcome = sortedOutcomes[1];
  const topPct = pct(priceOf(topOutcome)) ?? 0;
  // For the bar, the second slice is the complement so the row always
  // fills; the legend/buttons still show the real second price.
  const secondPct = 100 - topPct;
  const maxLadderPct = Math.max(
    1,
    ...displayedOutcomes.map((o) => pct(priceOf(o)) ?? 0),
  );

  const isOpen = timeUntil(market.closesAt) !== 'closed';
  const vol = usdShort(market.volume24hUsd) ?? usdShort(market.volumeUsd);

  const openTrade = (extId: string, nextSide: Side = 'BUY') => {
    setSelectedOutcome(extId);
    setSide(nextSide);
    setTradeOpen(true);
  };

  async function handleSubmit() {
    if (!outcome || !walletConnected || submitting) return;
    setSubmitting(true);
    try {
      await onTrade?.({
        outcomeExternalId: outcome.externalId,
        side,
        usdAmount: amount,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="
        my-3 overflow-hidden rounded-[12px]
        border border-line-2
        bg-gradient-to-b from-brand/[0.06] to-black/20
        font-display
      "
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-line">
        <div className="w-7 h-7 rounded-[7px] bg-brand-soft text-brand-2 flex items-center justify-center flex-none">
          {market.imageUrl ? (
            <img src={market.imageUrl} alt="" className="w-full h-full rounded-[7px] object-cover" />
          ) : (
            <I.markets className="w-3.5 h-3.5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-ink leading-[1.35] line-clamp-2">
            {market.question}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-mono text-ink-3 tracking-[0.04em]">
            {vol && (
              <>
                <span>${vol} vol</span>
                <span className="w-[2px] h-[2px] rounded-full bg-ink-4" />
              </>
            )}
            <span>{isOpen ? `closes in ${timeUntil(market.closesAt)}` : 'closed'}</span>
          </div>
        </div>
        {isOpen && (
          <span className="flex-none inline-flex items-center gap-1 px-1.5 py-1 rounded-full bg-green-vivid/15 text-green-2 border border-green-vivid/35 font-mono text-[9px] font-semibold tracking-[0.1em] uppercase">
            <span className="w-[5px] h-[5px] rounded-full bg-green-2" />
            Live
          </span>
        )}
      </div>

      {isBinary ? (
        <BinaryBody
          topLabel={topOutcome?.label ?? 'Yes'}
          secondLabel={secondOutcome?.label ?? 'No'}
          topPct={topPct}
          secondPct={secondPct}
          topPrice={dollars(priceOf(topOutcome))}
          secondPrice={dollars(priceOf(secondOutcome))}
          selected={tradeOpen ? selectedOutcome : undefined}
          topId={topOutcome?.externalId}
          secondId={secondOutcome?.externalId}
          onBuy={(id) => openTrade(id, 'BUY')}
        />
      ) : (
        <div className="px-3 py-2.5 flex flex-col gap-1.5">
          {displayedOutcomes.map((o, i) => {
            const p = pct(priceOf(o)) ?? 0;
            const active = o.externalId === selectedOutcome && tradeOpen;
            return (
              <button
                type="button"
                key={o.externalId}
                onClick={() => openTrade(o.externalId, 'BUY')}
                className={[
                  'flex items-center gap-2.5 px-2.5 py-1.5 rounded-[9px] border text-left transition-colors',
                  active
                    ? 'bg-brand-soft border-brand-2/60'
                    : 'bg-white/[0.03] border-line hover:border-line-2',
                ].join(' ')}
              >
                <span className="flex-1 min-w-0 flex items-center gap-2 text-[12.5px] text-ink truncate">
                  <span
                    className="w-[7px] h-[7px] rounded-sm flex-none"
                    style={{ background: SWATCHES[i % SWATCHES.length] }}
                  />
                  <span className="truncate">{o.label}</span>
                </span>
                <span className="block w-[44px] sm:w-[60px] h-1 rounded-full bg-white/[0.06] overflow-hidden flex-none">
                  <span
                    className="block h-full"
                    style={{
                      width: `${(p / maxLadderPct) * 100}%`,
                      background: SWATCHES[i % SWATCHES.length],
                    }}
                  />
                </span>
                <span className="font-mono text-[12px] font-semibold text-ink min-w-[34px] text-right flex-none">
                  {p}%
                </span>
              </button>
            );
          })}
          {sortedOutcomes.length > OUTCOME_DISPLAY_CAP && (
            <button
              type="button"
              onClick={() => setShowAllOutcomes((v) => !v)}
              className="self-start px-1 py-1 text-[12px] text-brand-2 hover:underline"
            >
              {showAllOutcomes ? 'Show less' : `+${hiddenOutcomeCount} more`}
            </button>
          )}
        </div>
      )}

      {/* Trade row — revealed once an outcome is selected. */}
      {tradeOpen && (
        <div className="px-3 pb-3 pt-1 flex flex-col gap-2 border-t border-line">
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-[8px] bg-surface-2 border border-line p-0.5">
              {(['BUY', 'SELL'] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSide(s)}
                  className={[
                    'rounded-[6px] px-2.5 py-1 text-[11px] font-semibold font-mono tracking-[0.04em] transition-colors',
                    side === s
                      ? s === 'BUY'
                        ? 'bg-green-vivid/20 text-green-2'
                        : 'bg-pink-vivid/20 text-pink-2'
                      : 'text-ink-3 hover:text-ink',
                  ].join(' ')}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* USD amount input — Polymarket-style. */}
            <div className="relative flex-1 max-w-[140px]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-mono text-ink-3">
                $
              </span>
              <input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="
                  w-full pl-6 pr-3 py-1.5 rounded-[10px]
                  border border-line bg-canvas
                  text-[14px] font-mono tabular-nums text-ink
                  placeholder:text-ink-4 outline-none focus:border-line-2
                "
                placeholder="0"
              />
            </div>

            <div className="ml-auto text-right">
              <div className="text-[10px] font-mono uppercase tracking-[0.06em] text-ink-3">to win</div>
              <div className="font-mono tabular-nums text-[14px] font-semibold text-green-2">
                ${maxPayout}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10.5px] font-mono text-ink-3">
            <span>
              {walletConnected
                ? `wallet $${walletBalanceUsd ?? '0.00'}`
                : 'trading not enabled'}
            </span>
            <span>
              {estimatedShares != null
                ? `≈ ${estimatedShares.toFixed(0)} shares · profit $${profitToWin}`
                : '—'}
            </span>
          </div>

          {readinessSlot}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!walletConnected || submitting || !outcome || numericAmount <= 0}
            className={[
              'w-full rounded-full h-10 text-[13px] font-semibold transition',
              !walletConnected
                ? 'bg-white/5 text-ink-3'
                : 'bg-brand text-ink hover:bg-brand-2 shadow-[0_8px_22px_-6px_rgba(88,34,251,0.55)]',
              'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none',
            ].join(' ')}
          >
            {!walletConnected
              ? 'Enable trading'
              : submitting
                ? 'Submitting…'
                : `${side === 'BUY' ? 'Buy' : 'Sell'}${outcome ? ` ${outcome.label}` : ''} · $${numericAmount || 0}`}
          </button>
        </div>
      )}
    </div>
  );
}

function BinaryBody({
  topLabel, secondLabel, topPct, secondPct, topPrice, secondPrice,
  selected, topId, secondId, onBuy,
}: {
  topLabel: string;
  secondLabel: string;
  topPct: number;
  secondPct: number;
  topPrice: string;
  secondPrice: string;
  selected?: string;
  topId?: string;
  secondId?: string;
  onBuy: (id: string) => void;
}) {
  return (
    <>
      {/* Probability bar */}
      <div className="flex h-1.5 mx-3 mt-2.5 mb-1 rounded-full overflow-hidden bg-white/[0.05]">
        <span className="bg-gradient-to-r from-green-vivid to-green-2" style={{ width: `${topPct}%` }} />
        <span className="bg-gradient-to-r from-pink-vivid to-pink-2" style={{ width: `${secondPct}%` }} />
      </div>
      {/* Legend */}
      <div className="flex justify-between px-3 pb-2.5 font-mono text-[10.5px] tracking-[0.04em]">
        <span className="text-green-2 truncate max-w-[48%]">{topLabel} · {topPct}%</span>
        <span className="text-pink-2 truncate max-w-[48%] text-right">{secondLabel} · {secondPct}%</span>
      </div>
      {/* Buy buttons */}
      <div className="flex gap-1.5 px-2.5 pb-2.5">
        <button
          type="button"
          onClick={() => topId && onBuy(topId)}
          className={[
            'flex-1 h-[38px] rounded-[9px] border font-semibold text-[12.5px] flex items-center justify-center gap-1.5 transition-colors',
            selected === topId
              ? 'bg-green-vivid/25 border-green-vivid/50 text-green-2'
              : 'bg-green-vivid/12 border-green-vivid/30 text-green-2 hover:bg-green-vivid/20',
          ].join(' ')}
        >
          Buy {topLabel}
          <span className="font-mono text-[11.5px] font-semibold opacity-80">{topPrice}</span>
        </button>
        <button
          type="button"
          onClick={() => secondId && onBuy(secondId)}
          className={[
            'flex-1 h-[38px] rounded-[9px] border font-semibold text-[12.5px] flex items-center justify-center gap-1.5 transition-colors',
            selected === secondId
              ? 'bg-pink-vivid/20 border-pink-vivid/45 text-pink-2'
              : 'bg-pink-vivid/10 border-pink-vivid/25 text-pink-2 hover:bg-pink-vivid/18',
          ].join(' ')}
        >
          Buy {secondLabel}
          <span className="font-mono text-[11.5px] font-semibold opacity-80">{secondPrice}</span>
        </button>
      </div>
    </>
  );
}
