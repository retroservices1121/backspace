// Market Detail page — port of /webui's screen 3.
//
// Real data sources (from /api/markets/[id] via useMarket):
//   - question, category, image, closesAt, status
//   - outcomes[].lastPrice (YES/NO or multi)
//
// Stubbed with "Coming soon" notes (no backend yet):
//   - 24h price delta + 24h volume + total OI + traders count
//     → would need a price-history table; the import path only
//        snapshots current price
//   - Chart curve → same; rendering a decorative SVG so the
//     screen isn't empty, with an honest caption
//   - Recent trades / Top holders / Related markets / per-market
//     comments → none of these have endpoints yet
//
// Trade interaction: inline shares input below the big blocks
// fires the existing useTrade handler. WalletReadiness covers
// the "set up wallet" gating.

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Loading from 'react-loading';

import { useMarket } from '@src/hooks/useMarket';
import { useTrade } from '@src/hooks/useTrade';
import { WalletReadiness } from 'components/Market/WalletReadiness';
import { ShellIcons as I } from 'components/Shell/icons';

import { APP } from 'pages';

function fmtDate(d?: Date): string {
  if (!d) return '—';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric' });
}

export default function MarketDetail() {
  const router = useRouter();
  const id = (router.query.id as string) ?? '';
  const { data: market, isLoading } = useMarket(id || null);

  if (isLoading || !market) {
    return (
      <div className="flex w-full justify-center py-10">
        <Loading type="spinningBubbles" color="#7B4CFF" height={50} width={50} />
      </div>
    );
  }

  // Pick the leading binary outcome (YES/NO). For multi-outcome we
  // fall back to the two highest-priced options so the big blocks
  // always render — a future revision can render a ladder instead.
  const sortedOutcomes = [...market.outcomes]
    .filter((o) => o.lastPrice != null)
    .map((o) => ({ ...o, p: parseFloat(o.lastPrice as unknown as string) }))
    .sort((a, b) => b.p - a.p);
  const yesOutcome = sortedOutcomes[0];
  const noOutcome = sortedOutcomes[1];
  const yesPct = yesOutcome ? Math.round(yesOutcome.p * 100) : null;
  const noPct = noOutcome ? Math.round(noOutcome.p * 100) : null;

  return (
    <div className="font-display text-ink">
      <div className="px-6 pt-6 pb-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.06em] text-ink-3">
          <span className="cursor-pointer hover:text-ink" onClick={() => router.push(APP.MARKETS.INDEX)}>
            Markets
          </span>
          <span className="text-ink-4">›</span>
          {market.category && (
            <>
              <span>{market.category}</span>
              <span className="text-ink-4">›</span>
            </>
          )}
          <span className="text-ink truncate max-w-[40ch]">{market.question}</span>
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-green-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-vivid shadow-[0_0_0_3px_rgba(14,173,105,0.18)]" />
            Live
          </span>
        </div>

        {/* Big question */}
        <h2 className="mt-3 text-[28px] font-bold tracking-[-0.022em] text-ink max-w-[32ch] leading-tight">
          {market.question}
        </h2>

        {/* Created-by / meta — we don't capture market author
            attribution on Polymarket imports, so this just shows the
            resolve date + a sample placeholder for traders/volume
            until we wire those fields into the import. */}
        <div className="mt-2 text-[13px] text-ink-3">
          <span className="text-ink-2">Polymarket</span>
          <span className="mx-2 text-ink-4">·</span>
          <span>resolves {fmtDate(market.closesAt)}</span>
          <span className="mx-2 text-ink-4">·</span>
          <span className="italic">volume / trader counts coming soon</span>
        </div>

        {/* Big YES/NO blocks */}
        {yesOutcome && noOutcome && yesPct != null && noPct != null && (
          <BigBlocks
            market={market}
            yesOutcome={yesOutcome}
            noOutcome={noOutcome}
            yesPct={yesPct}
            noPct={noPct}
          />
        )}
      </div>

      {/* Stats row — Resolves is real; the others are placeholders
          until the import grabs Polymarket's volume + traders. */}
      <div className="mx-6 mb-4 grid grid-cols-4 gap-[1px] rounded-[14px] overflow-hidden bg-line">
        <Stat label="Volume (24h)" value="—" sub="coming soon" />
        <Stat label="Open interest" value="—" sub="coming soon" />
        <Stat label="Traders" value="—" sub="coming soon" />
        <Stat label="Resolves" value={fmtDate(market.closesAt)} sub="" />
      </div>

      {/* Chart placeholder — synthetic curve to anchor the visual.
          Caption is honest about what's coming. */}
      <SyntheticChart />

      {/* Tabs row + the Recent trades stub */}
      <TradesTabs />
    </div>
  );
}

function BigBlocks({
  market, yesOutcome, noOutcome, yesPct, noPct,
}: {
  market: any;
  yesOutcome: any;
  noOutcome: any;
  yesPct: number;
  noPct: number;
}) {
  const trade = useTrade({ id: market.id, negRisk: market.negRisk });
  const [side, setSide] = useState<'YES' | 'NO' | null>(null);
  const [shares, setShares] = useState('10');

  const onBuy = async (which: 'YES' | 'NO') => {
    const outcome = which === 'YES' ? yesOutcome : noOutcome;
    await trade.handleTrade({
      outcomeExternalId: outcome.externalId,
      side: 'BUY',
      shares,
    });
    setSide(null);
  };

  return (
    <div className="mt-5 flex flex-col gap-3">
      <div className="flex gap-3">
        <BigBlock
          label="YES"
          pct={yesPct}
          payout={(100 / yesPct).toFixed(2)}
          tone="yes"
          onBuy={() => setSide('YES')}
        />
        <BigBlock
          label="NO"
          pct={noPct}
          payout={(100 / noPct).toFixed(2)}
          tone="no"
          onBuy={() => setSide('NO')}
        />
      </div>

      {/* Inline buy panel — appears under the blocks when a side
          is selected. Keeps the trade gesture lightweight (no
          modal) until the trade-slip overlay design is built. */}
      {side && (
        <div className="rounded-[14px] border border-line bg-surface p-4 flex items-end gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-3">
              Buy {side} — shares
            </label>
            <input
              type="number"
              min="1"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="
                bg-canvas border border-line rounded-[10px]
                px-3 py-2 text-ink text-[16px] font-mono
                outline-none focus:border-line-2
              "
            />
          </div>
          <button
            type="button"
            onClick={() => onBuy(side)}
            disabled={!trade.walletConnected}
            className={[
              'rounded-[10px] px-5 py-2.5 text-[14px] font-semibold',
              'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
              side === 'YES'
                ? 'bg-green-vivid hover:bg-green-2 text-ink'
                : 'bg-pink-vivid hover:bg-pink-2 text-ink',
            ].join(' ')}
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={() => setSide(null)}
            className="rounded-[10px] px-3 py-2.5 text-[14px] text-ink-2 hover:text-ink"
          >
            Cancel
          </button>
        </div>
      )}

      {/* WalletReadiness shows up only when there's no trading
          session yet — same gating component MarketCard uses. */}
      {!trade.walletConnected && (
        <WalletReadiness />
      )}
    </div>
  );
}

function BigBlock({
  label, pct, payout, tone, onBuy,
}: {
  label: 'YES' | 'NO';
  pct: number;
  payout: string;
  tone: 'yes' | 'no';
  onBuy: () => void;
}) {
  const isYes = tone === 'yes';
  const tint = isYes ? 'rgba(14,173,105,0.12)' : 'rgba(255,84,112,0.12)';
  const border = isYes ? 'rgba(14,173,105,0.32)' : 'rgba(255,84,112,0.32)';
  const accent = isYes ? 'text-green-2' : 'text-pink-2';
  const btnBase = isYes
    ? 'bg-green-vivid hover:bg-green-2 text-ink'
    : 'bg-pink-vivid hover:bg-pink-2 text-ink';

  return (
    <div
      className="flex-1 rounded-[14px] p-5 transition-transform duration-150 hover:-translate-y-0.5"
      style={{ background: tint, border: `1px solid ${border}` }}
    >
      <div className="text-[11px] uppercase tracking-[0.16em] font-mono text-ink-3">
        {label}
      </div>
      <div className={`mt-2 text-[48px] font-bold italic leading-none ${accent}`}>
        {pct}%
      </div>
      <div className={`mt-1 text-[12px] font-mono ${accent}`}>
        Payout · {payout}×
      </div>
      <button
        type="button"
        onClick={onBuy}
        className={`mt-4 w-full rounded-[10px] py-2.5 text-[14px] font-semibold transition-colors ${btnBase}`}
      >
        Buy {label}
      </button>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-canvas px-4 py-3 flex flex-col gap-1">
      <div className="text-[10px] uppercase tracking-[0.08em] text-ink-3 font-mono">
        {label}
      </div>
      <div className="text-[20px] font-mono font-semibold text-ink">{value}</div>
      <div className="text-[11px] text-ink-3 font-mono truncate">{sub}</div>
    </div>
  );
}

function SyntheticChart() {
  // Hand-built decorative probability curve so the screen has a
  // chart-shaped block in place. Real chart ships when the
  // price-history table lands.
  const points: Array<[number, number]> = [
    [0, 50], [4, 48], [8, 52], [12, 49], [16, 55], [22, 53], [28, 58], [34, 56], [40, 60],
    [46, 57], [52, 63], [58, 61], [64, 66], [70, 63], [76, 60], [82, 64], [88, 62], [94, 62],
  ];
  const W = 880;
  const H = 200;
  const xs = (v: number) => (v / 100) * W;
  const ys = (v: number) => H - (v / 100) * H;
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xs(p[0])},${ys(p[1])}`).join(' ');
  const fillD = `${pathD} L${xs(94)},${H} L${xs(0)},${H} Z`;

  return (
    <div className="mx-6 mb-4 rounded-[14px] border border-line bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="m-0 text-[14px] font-semibold tracking-[-0.005em] text-ink">
          YES probability — 14 days
          <span className="ml-2 text-[10px] font-mono uppercase tracking-[0.08em] text-ink-3">
            preview · real chart shipping with price history
          </span>
        </h4>
        <div className="flex items-center gap-1 rounded-[10px] bg-canvas border border-line p-0.5">
          {['1H', '1D', '14D', '1M', 'ALL'].map((r) => (
            <button
              key={r}
              type="button"
              disabled
              className={[
                'px-2.5 py-1 rounded-[8px] text-[11px] font-mono',
                r === '14D' ? 'bg-brand-soft text-ink' : 'text-ink-3',
              ].join(' ')}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[200px] w-full">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="md-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7B4CFF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#7B4CFF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="md-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5822FB" />
              <stop offset="100%" stopColor="#7B4CFF" />
            </linearGradient>
          </defs>
          {[25, 50, 75].map((p) => (
            <line key={p} x1="0" x2={W} y1={ys(p)} y2={ys(p)} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
          ))}
          <path d={fillD} fill="url(#md-fill)" />
          <path d={pathD} stroke="url(#md-line)" strokeWidth="2.5" fill="none" />
          <circle cx={xs(94)} cy={ys(62)} r="5" fill="#7B4CFF" stroke="#fff" strokeWidth="2" />
          {[75, 50, 25].map((p) => (
            <text
              key={p}
              x="0"
              y={ys(p) - 4}
              fill="rgba(255,255,255,0.35)"
              fontSize="10"
              fontFamily="JetBrains Mono"
            >
              {p}%
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}

function TradesTabs() {
  const tabs = ['Recent trades', 'Top holders', 'Comments', 'Related markets'];
  const [active, setActive] = useState(tabs[0]);
  return (
    <div className="mx-6 mb-8 rounded-[14px] border border-line bg-surface overflow-hidden">
      <div className="flex items-center gap-1 px-3 border-b border-line">
        {tabs.map((t) => {
          const isActive = t === active;
          return (
            <button
              type="button"
              key={t}
              onClick={() => setActive(t)}
              className={[
                'relative px-3 py-3 text-[13px] font-medium',
                'transition-colors duration-150',
                isActive ? 'text-ink' : 'text-ink-2 hover:text-ink',
              ].join(' ')}
            >
              {t}
              {isActive && (
                <span className="absolute left-2 right-2 -bottom-px h-[3px] rounded-full bg-brand-2" />
              )}
            </button>
          );
        })}
      </div>
      <div className="p-5 text-[13px] text-ink-3 font-mono">
        {active === 'Recent trades' && (
          <>
            <I.dots className="w-4 h-4 inline-block invisible" />
            Recent trades feed ships with the trade-history backend.
            <br />Until then, trades placed here surface in
            <span className="text-brand-2"> /portfolio </span>.
          </>
        )}
        {active === 'Top holders' && 'Top holders ships when on-chain position aggregation lands.'}
        {active === 'Comments' && 'Per-market comments — coming soon.'}
        {active === 'Related markets' && 'Related markets ships with the recommender.'}
      </div>
    </div>
  );
}
