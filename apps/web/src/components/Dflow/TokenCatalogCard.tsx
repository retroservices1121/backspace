// Single-row token catalog card. Used in the home feed under the
// TOKENS filter and in the standalone /tokens page. Compact — logo +
// symbol + name + Trade button — because the row is the index of the
// catalog; the deep view (chart, swap UI, holders) belongs in a
// future token detail page.
//
// Sort fields like volume/price/change24h aren't on Token yet (those
// land with the trending-data migration). The card is built to grow
// into them — a `change24h` slot is reserved but renders empty until
// the schema catches up.

import React from 'react';
import { useRouter } from 'next/router';

import type { TokenLite } from '@src/store/feedSlice';

type Props = {
  token: TokenLite;
  /** Optional priceUsd from a future price feed; renders when present. */
  priceUsd?: string | number | null;
  /** Optional 24h change, % (e.g. 4.2 for +4.2%). Renders when present. */
  change24hPct?: number | null;
};

export function TokenCatalogCard({ token, priceUsd, change24hPct }: Props) {
  const router = useRouter();

  const onTrade = () => {
    // Route the user into the swap experience for this token. Today
    // that's `/tokens/[mint]`, which we'll wire as the detail page in
    // the same task. For now, fall back to opening the Dflow swap with
    // the token preselected by mint via query param.
    router.push(`/tokens/${token.mint}`);
  };

  const fmtChange = (n: number) => {
    const abs = Math.abs(n).toFixed(2);
    return `${n >= 0 ? '+' : '-'}${abs}%`;
  };

  return (
    <div
      onClick={onTrade}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onTrade();
        }
      }}
      className="
        flex items-center gap-3.5
        px-5 py-3.5
        border-b border-line cursor-pointer
        hover:bg-hover transition-colors duration-150
        font-display text-ink
      "
    >
      {/* Logo */}
      {token.logoURI ? (
        <img
          src={token.logoURI}
          alt=""
          className="w-10 h-10 rounded-full flex-none object-cover bg-surface"
        />
      ) : (
        <div
          className="w-10 h-10 rounded-full flex-none flex items-center justify-center text-[12px] font-bold text-ink/80"
          style={{ background: 'linear-gradient(135deg,#5822FB,#FF8800)' }}
        >
          {token.symbol.slice(0, 2)}
        </div>
      )}

      {/* Symbol + Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-semibold text-ink truncate">
            {token.symbol}
          </span>
          <span className="text-[12px] text-ink-3 font-mono truncate">
            {token.name}
          </span>
        </div>
        <div className="mt-0.5 text-[11px] text-ink-3 font-mono truncate">
          {token.mint.slice(0, 4)}…{token.mint.slice(-4)} · Solana
        </div>
      </div>

      {/* Price + change column — only renders when data exists. Once
          the price snapshot job lands these fields are populated server
          side; until then the column is invisible and the layout stays
          stable. */}
      {(priceUsd != null || change24hPct != null) && (
        <div className="flex-none text-right">
          {priceUsd != null && (
            <div className="text-[14px] font-mono font-semibold text-ink tabular-nums">
              ${typeof priceUsd === 'string' ? priceUsd : priceUsd.toFixed(priceUsd < 1 ? 4 : 2)}
            </div>
          )}
          {change24hPct != null && (
            <div
              className={[
                'text-[11px] font-mono tabular-nums',
                change24hPct >= 0 ? 'text-green-2' : 'text-pink-vivid',
              ].join(' ')}
            >
              {fmtChange(change24hPct)}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTrade();
        }}
        className="
          flex-none rounded-full bg-brand hover:bg-brand-2
          px-4 h-9 text-[13px] font-semibold text-ink
          transition-colors duration-150
          shadow-[0_8px_22px_-6px_rgba(88,34,251,0.55)]
        "
      >
        Trade
      </button>
    </div>
  );
}
