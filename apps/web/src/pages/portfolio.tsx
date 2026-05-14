// Portfolio — the user's open Polymarket positions, read straight from
// Polymarket's Data API (via /api/polymarket/positions). Positions are
// the venue's source of truth; nothing here is computed from our local
// Trade log.

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

import { usePositions, PolymarketPosition } from '@src/hooks/usePositions';

function usd(n: number): string {
  return `$${n.toFixed(2)}`;
}

function price(n: number): string {
  // Polymarket prices are 0..1 probabilities; show as cents-on-the-dollar.
  return `$${n.toFixed(2)}`;
}

function PnlCell({ position }: { position: PolymarketPosition }) {
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

function PositionsTable({ positions }: { positions: PolymarketPosition[] }) {
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
              key={`${p.conditionId}-${p.asset}`}
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
                    <div className="truncate font-medium text-white">
                      {p.title}
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

const Portfolio: React.VFC = () => {
  const { data, isLoading, isError, safeAddress } = usePositions();

  return (
    <div className="mx-auto h-full w-full max-w-4xl px-4 py-8">
      <Head>
        <title>Portfolio</title>
      </Head>

      <h1 className="mb-1 text-2xl font-semibold text-white">Portfolio</h1>
      <p className="mb-6 text-sm text-white/50">
        Your open positions on Polymarket markets.
      </p>

      {!safeAddress ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-6 text-sm text-white/60">
          Log in to see your positions.
        </div>
      ) : isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
      ) : isError ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-6 text-sm text-rose-200">
          Couldn’t load your positions. Try refreshing.
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-6 text-sm text-white/60">
          No open positions yet.{' '}
          <Link href="/settings/wallet">
            <a className="text-white/80 underline hover:text-white">
              Fund your trading wallet
            </a>
          </Link>{' '}
          to get started.
        </div>
      ) : (
        <PositionsTable positions={data} />
      )}
    </div>
  );
};

export default Portfolio;
