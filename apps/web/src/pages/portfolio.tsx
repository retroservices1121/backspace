// Portfolio — the user's open positions across venues.
//
// Two tabs:
//   - Markets: Polymarket positions read straight from Polymarket's
//     Data API via /api/polymarket/positions (the venue is the source
//     of truth; nothing is computed from our local Trade log).
//   - Tokens: SOL + SPL balances pulled live from Solana RPC, plus the
//     user's recent Dflow swap audit rows.

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSolanaWallets } from '@privy-io/react-auth';

import { useDflowTrades, DflowTrade } from '@src/hooks/useDflowTrades';
import { pickEmbeddedSolanaWallet } from '@src/lib/dflow';
import { useSolanaBalances, SolanaBalance } from '@src/hooks/useSolanaBalances';
import { useAllPositions, SourcedPosition } from '@src/hooks/usePositions';

function usd(n: number): string {
  return `$${n.toFixed(2)}`;
}

function price(n: number): string {
  return `$${n.toFixed(2)}`;
}

function fmtAmount(raw: string, decimals: number, max = 6): string {
  // Convert atomic -> human, capping fractional digits for display.
  const padded = raw.padStart(decimals + 1, '0');
  const whole = padded.slice(0, padded.length - decimals) || '0';
  const frac = padded.slice(padded.length - decimals).replace(/0+$/, '');
  if (!frac) return whole;
  return `${whole}.${frac.slice(0, max)}`;
}

function PnlCell({ position }: { position: SourcedPosition }) {
  const up = position.cashPnl >= 0;
  return (
    <span className={up ? 'text-emerald-300' : 'text-rose-300'}>
      {up ? '+' : ''}
      {usd(position.cashPnl)}{' '}
      <span className="text-white/40">
        ({up ? '+' : ''}
        {position.percentPnl.toFixed(1)}%)
      </span>
    </span>
  );
}

function SourceBadge({ source }: { source: SourcedPosition['source'] }) {
  // Only badge the off-platform rows — the embedded-Safe positions
  // are the default and don't need a tag.
  if (source !== 'linked') return null;
  return (
    <span className="ml-2 rounded-md border border-white/20 bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-white/60">
      linked
    </span>
  );
}

function PositionsTable({ positions }: { positions: SourcedPosition[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-widest text-white/40">
            <th className="px-4 py-3 font-medium">Market</th>
            <th className="px-4 py-3 text-right font-medium">Shares</th>
            <th className="px-4 py-3 text-right font-medium">Avg</th>
            <th className="px-4 py-3 text-right font-medium">Current</th>
            <th className="px-4 py-3 text-right font-medium">Value</th>
            <th className="px-4 py-3 text-right font-medium">P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr
              key={`${p.safeAddress}-${p.conditionId}-${p.asset}`}
              className="border-b border-white/5 last:border-0"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {p.icon && (
                    <img
                      src={p.icon}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-md object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center truncate font-medium text-white">
                      <span className="truncate">{p.title}</span>
                      <SourceBadge source={p.source} />
                    </div>
                    <div className="text-xs text-white/50">{p.outcome}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-white/80">
                {p.size.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-white/80">
                {price(p.avgPrice)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-white/80">
                {price(p.curPrice)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-white">
                {usd(p.currentValue)}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums">
                <PnlCell position={p} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BalancesTable({ balances }: { balances: SolanaBalance[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-widest text-white/40">
            <th className="px-4 py-3 font-medium">Token</th>
            <th className="px-4 py-3 text-right font-medium">Balance</th>
          </tr>
        </thead>
        <tbody>
          {balances.map((b) => (
            <tr key={b.mint} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {b.logoURI && (
                    <img
                      src={b.logoURI}
                      alt=""
                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="font-medium text-white">
                      {b.symbol ?? `${b.mint.slice(0, 4)}…${b.mint.slice(-4)}`}
                    </div>
                    {b.name && (
                      <div className="text-xs text-white/50">{b.name}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-white">
                {b.uiAmount.toLocaleString(undefined, {
                  maximumFractionDigits: 6,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentSwaps({ trades }: { trades: DflowTrade[] }) {
  if (trades.length === 0) return null;
  return (
    <div className="mt-6">
      <h3 className="mb-2 text-sm font-semibold text-white/70">Recent swaps</h3>
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-widest text-white/40">
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Swap</th>
              <th className="px-4 py-3 font-medium">Tx</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => {
              const inDec = t.inputToken?.decimals ?? 0;
              const outDec = t.outputToken?.decimals ?? 0;
              const inSym = t.inputToken?.symbol ?? `${t.inputMint.slice(0, 4)}…`;
              const outSym = t.outputToken?.symbol ?? `${t.outputMint.slice(0, 4)}…`;
              return (
                <tr key={t.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-white/60">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-white">
                    {fmtAmount(t.inputAmount, inDec)} {inSym} →{' '}
                    {fmtAmount(t.outputAmount, outDec)} {outSym}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://solscan.io/tx/${t.txSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-white/60 underline hover:text-white/80"
                    >
                      {t.txSignature.slice(0, 6)}…{t.txSignature.slice(-6)}
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MarketsTab() {
  const { positions, isLoading, isError, safeCount, hasLinkedWallets } =
    useAllPositions();

  if (safeCount === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-6 text-sm text-white/60">
        Log in to see your positions.
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
    );
  }
  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-6 text-sm text-rose-200">
        Couldn’t load your positions. Try refreshing.
      </div>
    );
  }
  if (positions.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-6 text-sm text-white/60">
        No open positions yet.{' '}
        <Link href="/settings/wallet">
          <a className="text-white/80 underline hover:text-white">
            Fund your trading wallet
          </a>
        </Link>
        {!hasLinkedWallets && (
          <>
            {' '}or{' '}
            <Link href="/settings/wallet">
              <a className="text-white/80 underline hover:text-white">
                link an existing Polymarket wallet
              </a>
            </Link>
          </>
        )}
        .
      </div>
    );
  }
  return <PositionsTable positions={positions} />;
}

function TokensTab() {
  const { wallets } = useSolanaWallets();
  const wallet = pickEmbeddedSolanaWallet(wallets);
  const address = wallet?.address ?? null;
  const balances = useSolanaBalances(address);
  const trades = useDflowTrades(true);

  if (!address) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-6 text-sm text-white/60">
        No Solana wallet yet.{' '}
        <Link href="/settings/wallet">
          <a className="text-white/80 underline hover:text-white">
            Create one in settings
          </a>
        </Link>{' '}
        to start swapping.
      </div>
    );
  }
  return (
    <>
      <div className="mb-3 text-xs text-white/50 break-all">
        Solana wallet: <span className="font-mono">{address}</span>
      </div>
      {balances.isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
      ) : balances.isError ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-6 text-sm text-rose-200">
          Couldn’t load balances. Try refreshing.
        </div>
      ) : !balances.data || balances.data.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-6 text-sm text-white/60">
          No tokens yet. Fund the wallet above with SOL to start swapping.
        </div>
      ) : (
        <BalancesTable balances={balances.data} />
      )}
      <RecentSwaps trades={trades.data ?? []} />
    </>
  );
}

type Tab = 'markets' | 'tokens';

const Portfolio: React.VFC = () => {
  const [tab, setTab] = useState<Tab>('markets');
  return (
    <div className="mx-auto h-full w-full max-w-4xl px-4 py-8">
      <Head>
        <title>Portfolio</title>
      </Head>

      <h1 className="mb-1 text-2xl font-semibold text-white">Portfolio</h1>
      <p className="mb-6 text-sm text-white/50">
        Your positions and balances across venues.
      </p>

      <div className="mb-4 flex gap-2 border-b border-white/10">
        {(['markets', 'tokens'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium transition ${
              tab === t
                ? 'border-b-2 border-white text-white'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            {t === 'markets' ? 'Markets' : 'Tokens'}
          </button>
        ))}
      </div>

      {tab === 'markets' ? <MarketsTab /> : <TokensTab />}
    </div>
  );
};

export default Portfolio;
