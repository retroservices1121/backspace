// Portfolio — open positions + balances across venues, rebuilt on
// the new design tokens. Two tabs:
//   - Markets: Polymarket positions from /api/polymarket/positions
//     (venue is the source of truth — nothing computed locally).
//   - Tokens:  SOL + SPL balances pulled live from Solana RPC, plus
//     the user's recent Dflow swap audit rows.
//
// Sticky TopTabs at the top + horizontal pos-row layout from the
// /webui design (square YES/NO outcome tile + question + size +
// days remaining + unrealized P&L). Token rows mirror the same
// shape so the two tabs visually rhyme.

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useWallet } from '@src/lib/wallet';

import { useDflowTrades, DflowTrade } from '@src/hooks/useDflowTrades';
import { useSolanaBalances, SolanaBalance } from '@src/hooks/useSolanaBalances';
import { useAllPositions, SourcedPosition } from '@src/hooks/usePositions';

function usd(n: number): string {
  return `$${n.toFixed(2)}`;
}

function price(n: number): string {
  return `$${n.toFixed(2)}`;
}

function fmtAmount(raw: string, decimals: number, max = 6): string {
  const padded = raw.padStart(decimals + 1, '0');
  const whole = padded.slice(0, padded.length - decimals) || '0';
  const frac = padded.slice(padded.length - decimals).replace(/0+$/, '');
  if (!frac) return whole;
  return `${whole}.${frac.slice(0, max)}`;
}

function daysUntil(d?: string | Date | null): number | null {
  if (!d) return null;
  const target = new Date(d).getTime();
  if (Number.isNaN(target)) return null;
  const diffMs = target - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function PnlBlock({ position }: { position: SourcedPosition }) {
  const up = position.cashPnl >= 0;
  const tone = up ? 'text-green-2' : 'text-pink-2';
  const sign = up ? '+' : '';
  return (
    <div className="text-right flex-none">
      <div className={`text-[15px] font-mono font-semibold tabular-nums ${tone}`}>
        {sign}{usd(position.cashPnl)}
      </div>
      <div className="text-[11px] text-ink-3 font-mono">
        unrealized · {sign}{position.percentPnl.toFixed(1)}%
      </div>
    </div>
  );
}

function OutcomeTile({ outcome, source }: { outcome: string; source: SourcedPosition['source'] }) {
  // Best-effort YES/NO classification — Polymarket binary outcomes
  // come back with these exact labels. Anything else gets a neutral
  // tile in brand-soft so multi-outcome rows still render.
  const isYes = /^yes$/i.test(outcome);
  const isNo = /^no$/i.test(outcome);
  let bg = 'bg-brand-soft text-brand-2 border border-brand-2/30';
  let label: string = outcome.slice(0, 3).toUpperCase();
  if (isYes) {
    bg = 'bg-green-vivid/12 text-green-2 border border-green-vivid/30';
    label = 'YES';
  } else if (isNo) {
    bg = 'bg-pink-vivid/12 text-pink-2 border border-pink-vivid/30';
    label = 'NO';
  }

  return (
    <div className="relative flex-none">
      <div
        className={`w-[42px] h-[42px] rounded-[8px] flex items-center justify-center text-[11px] font-mono font-semibold ${bg}`}
      >
        {label}
      </div>
      {source === 'linked' && (
        <span
          className="absolute -bottom-1 -right-1 px-1 py-[1px] rounded text-[8px] uppercase tracking-widest bg-canvas border border-line text-ink-3 font-mono"
        >
          linked
        </span>
      )}
    </div>
  );
}

function PositionRow({ position }: { position: SourcedPosition }) {
  const days = daysUntil(position.endDate);
  const closesLabel = days == null
    ? null
    : days === 0
      ? 'resolves today'
      : `${days} day${days === 1 ? '' : 's'} remaining`;

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-line last:border-0 hover:bg-hover transition-colors">
      <OutcomeTile outcome={position.outcome} source={position.source} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[11px] font-mono text-ink-3">
          <span className="text-ink-2">
            {position.outcome} · {price(position.curPrice)}
          </span>
          {/* Category isn't on the position payload yet — leave the
              slot open so we can wire it without a layout shift. */}
        </div>
        <div className="text-[14px] font-medium text-ink leading-snug truncate">
          {position.title}
        </div>
        <div className="text-[11px] text-ink-3 font-mono mt-0.5 truncate">
          <span>{usd(position.currentValue)} value</span>
          {closesLabel && (
            <>
              <span className="mx-1.5">·</span>
              <span>{closesLabel}</span>
            </>
          )}
          <span className="mx-1.5">·</span>
          <span>{position.size.toFixed(2)} shares</span>
        </div>
      </div>
      <PnlBlock position={position} />
    </div>
  );
}

function BalanceRow({ balance }: { balance: SolanaBalance }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-line last:border-0 hover:bg-hover transition-colors">
      <div className="flex-none w-[42px] h-[42px] rounded-full overflow-hidden bg-surface-2 border border-line">
        {balance.logoURI && (
          <img src={balance.logoURI} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium text-ink truncate">
          {balance.symbol ?? `${balance.mint.slice(0, 4)}…${balance.mint.slice(-4)}`}
        </div>
        {balance.name && (
          <div className="text-[11px] text-ink-3 font-mono truncate">{balance.name}</div>
        )}
      </div>
      <div className="text-right flex-none">
        <div className="text-[15px] font-mono font-semibold tabular-nums text-ink">
          {balance.uiAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
        </div>
      </div>
    </div>
  );
}

function RecentSwaps({ trades }: { trades: DflowTrade[] }) {
  if (trades.length === 0) return null;
  return (
    <div className="mt-6 mx-5">
      <h3 className="text-[10px] uppercase tracking-[0.08em] text-ink-3 font-mono mb-2">
        Recent swaps
      </h3>
      <div className="rounded-[14px] border border-line bg-surface overflow-hidden">
        {trades.map((t) => {
          const inDec = t.inputToken?.decimals ?? 0;
          const outDec = t.outputToken?.decimals ?? 0;
          const inSym = t.inputToken?.symbol ?? `${t.inputMint.slice(0, 4)}…`;
          const outSym = t.outputToken?.symbol ?? `${t.outputMint.slice(0, 4)}…`;
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-0 text-[13px]"
            >
              <span className="text-ink-3 font-mono w-[10ch] flex-none">
                {new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
              <span className="flex-1 font-mono tabular-nums text-ink truncate">
                {fmtAmount(t.inputAmount, inDec)} {inSym}
                <span className="text-ink-3 mx-1.5">→</span>
                {fmtAmount(t.outputAmount, outDec)} {outSym}
              </span>
              <a
                href={`https://solscan.io/tx/${t.txSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] text-brand-2 hover:underline flex-none"
              >
                {t.txSignature.slice(0, 6)}…{t.txSignature.slice(-6)}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-5 rounded-[14px] border border-line bg-surface px-5 py-6 text-[13px] text-ink-3">
      {children}
    </div>
  );
}

function ErrorCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-5 rounded-[14px] border border-pink-vivid/30 bg-pink-vivid/10 px-5 py-6 text-[13px] text-pink-2">
      {children}
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="mx-5 h-32 animate-pulse rounded-[14px] border border-line bg-surface" />
  );
}

function MarketsTab() {
  const { positions, isLoading, isError, safeCount, hasLinkedWallets } = useAllPositions();
  if (safeCount === 0) {
    return <EmptyCard>Log in to see your positions.</EmptyCard>;
  }
  if (isLoading) return <LoadingCard />;
  if (isError) return <ErrorCard>Couldn’t load your positions. Try refreshing.</ErrorCard>;
  if (positions.length === 0) {
    return (
      <EmptyCard>
        No open positions yet.{' '}
        <Link href="/settings/wallet">
          <a className="text-brand-2 hover:underline">Fund your trading wallet</a>
        </Link>
        {!hasLinkedWallets && (
          <>
            {' '}or{' '}
            <Link href="/settings/wallet">
              <a className="text-brand-2 hover:underline">
                link an existing Polymarket wallet
              </a>
            </Link>
          </>
        )}.
      </EmptyCard>
    );
  }
  return (
    <div className="mx-5 rounded-[14px] border border-line bg-surface overflow-hidden">
      {positions.map((p) => (
        <PositionRow key={`${p.safeAddress}-${p.conditionId}-${p.asset}`} position={p} />
      ))}
    </div>
  );
}

function TokensTab() {
  const { embeddedSolanaWallet } = useWallet();
  const address = embeddedSolanaWallet?.address ?? null;
  const balances = useSolanaBalances(address);
  const trades = useDflowTrades(true);

  if (!address) {
    return (
      <EmptyCard>
        No Solana wallet yet.{' '}
        <Link href="/settings/wallet">
          <a className="text-brand-2 hover:underline">Create one in settings</a>
        </Link>{' '}
        to start swapping.
      </EmptyCard>
    );
  }
  return (
    <>
      <div className="mx-5 mb-3 text-[11px] font-mono text-ink-3 break-all">
        Solana wallet: <span className="text-ink-2">{address}</span>
      </div>
      {balances.isLoading ? (
        <LoadingCard />
      ) : balances.isError ? (
        <ErrorCard>Couldn’t load balances. Try refreshing.</ErrorCard>
      ) : !balances.data || balances.data.length === 0 ? (
        <EmptyCard>
          No tokens yet. Fund the wallet above with SOL to start swapping.
        </EmptyCard>
      ) : (
        <div className="mx-5 rounded-[14px] border border-line bg-surface overflow-hidden">
          {balances.data.map((b) => <BalanceRow key={b.mint} balance={b} />)}
        </div>
      )}
      <RecentSwaps trades={trades.data ?? []} />
    </>
  );
}

type Tab = 'markets' | 'tokens';

const Portfolio: React.VFC = () => {
  const [tab, setTab] = useState<Tab>('markets');
  const tabs: { key: Tab; label: string }[] = [
    { key: 'markets', label: 'Markets' },
    { key: 'tokens', label: 'Tokens' },
  ];

  return (
    <div className="font-display text-ink">
      <Head><title>Portfolio</title></Head>

      <div
        className="
          sticky top-0 z-10
          px-6 pt-3.5
          border-b border-line
          bg-canvas/[0.78]
          backdrop-blur-[14px] backdrop-saturate-[160%]
        "
      >
        <div className="flex items-center justify-between pb-3.5">
          <div>
            <h1 className="m-0 text-[20px] font-bold tracking-[-0.02em] text-ink">
              Portfolio
            </h1>
            <div className="mt-0.5 text-[11.5px] font-mono tracking-[0.06em] text-ink-3">
              Positions and balances across venues
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 -mx-1">
          {tabs.map((t) => {
            const isActive = t.key === tab;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
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

      <div className="py-5">
        {tab === 'markets' ? <MarketsTab /> : <TokensTab />}
      </div>
    </div>
  );
};

export default Portfolio;
