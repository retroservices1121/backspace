// Standalone Dflow spot-swap card. Drops into the Dev page, a token
// detail screen, or (with `compact`) inside a post embed. Pairs an
// input token (default SOL) against a fixed output token chosen by
// the caller.
//
// The card auto-refreshes the quote 250ms after the user finishes
// typing — quote pricing expires in seconds so we re-quote close to
// submit time. The wallet stays Privy-only: no external Solana
// adapters here.

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  fromAtomicAmount,
  MINT,
  toAtomicAmount,
  platformFeeBps,
} from '@src/lib/dflow';
import { useDflowSwap } from '@src/hooks/useDflowSwap';

import type { TokenData } from '@src/hooks/useToken';

type Props = {
  /** Token the user is buying. The "from" leg is always SOL for v1 —
   *  one-way Buy keeps the card legible inside a feed post. A bi-
   *  directional UI lands in Phase 5 once the picker exists. */
  outputToken: TokenData;
  /** When true, drop the title row and chrome — used by PostTokenCard. */
  compact?: boolean;
};

const DEFAULT_INPUT_AMOUNT = '0.05'; // 0.05 SOL — small enough to safely test live.
const QUOTE_DEBOUNCE_MS = 250;
// SOL's universal mint; web-known.
const SOL_DECIMALS = 9;

export function DflowSwapCard({ outputToken, compact }: Props) {
  const {
    walletAddress,
    walletsReady,
    quote,
    phase,
    error,
    signature,
    refreshQuote,
    submit,
    provisionWallet,
    isReady,
  } = useDflowSwap();

  const [amount, setAmount] = useState(DEFAULT_INPUT_AMOUNT);
  const [slippageBps, setSlippageBps] = useState(50);

  // Re-quote whenever the input amount or slippage settles. Debounce
  // because keystroke-rate /quote calls would burn API quota and
  // produce flicker. Skip when the amount can't yield a valid quote.
  useEffect(() => {
    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
    const t = setTimeout(() => {
      const atomic = toAtomicAmount(amount, SOL_DECIMALS);
      refreshQuote({
        inputMint: MINT.SOL,
        outputMint: outputToken.mint,
        amount: atomic,
        slippageBps,
      }).catch(() => undefined);
    }, QUOTE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [amount, slippageBps, outputToken.mint, refreshQuote]);

  const outAmountHuman = useMemo(() => {
    if (!quote) return null;
    return fromAtomicAmount(quote.outAmount, outputToken.decimals);
  }, [quote, outputToken.decimals]);

  const handleSubmit = useCallback(async () => {
    try {
      await submit();
    } catch {
      // Error state is already on the hook; toast is handled by callers.
    }
  }, [submit]);

  const submitting = phase === 'submitting';
  const quoting = phase === 'quoting';
  const succeeded = phase === 'success';
  const buttonDisabled =
    submitting || quoting || !quote || !walletAddress || succeeded;

  return (
    <div
      className={
        compact
          ? 'rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-3'
          : 'rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4'
      }
    >
      {!compact && (
        <div className="mb-3 flex items-center gap-2">
          {outputToken.logoURI && (
            <img
              src={outputToken.logoURI}
              alt=""
              className="h-8 w-8 rounded-full"
            />
          )}
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-white">
              Buy {outputToken.symbol}
            </div>
            <div className="truncate text-xs text-white/50">
              {outputToken.name}
            </div>
          </div>
          <span className="ml-auto text-[10px] uppercase tracking-widest text-white/40">
            via Dflow
          </span>
        </div>
      )}

      <label className="block text-[11px] uppercase tracking-widest text-white/40">
        You pay
      </label>
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
        <input
          type="number"
          min="0"
          step="0.001"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 bg-transparent text-base font-mono tabular-nums text-white placeholder-white/30 focus:outline-none"
          placeholder="0.0"
        />
        <span className="shrink-0 text-sm font-semibold text-white/80">SOL</span>
      </div>

      <div className="mt-3">
        <label className="block text-[11px] uppercase tracking-widest text-white/40">
          You receive
        </label>
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
          <div className="flex-1 text-base font-mono tabular-nums text-white">
            {quoting ? <span className="text-white/40">…</span> : (outAmountHuman ?? '—')}
          </div>
          {outputToken.logoURI && (
            <img
              src={outputToken.logoURI}
              alt=""
              className="h-5 w-5 rounded-full"
            />
          )}
          <span className="shrink-0 text-sm font-semibold text-white/80">
            {outputToken.symbol}
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-white/50">
        <div>
          slippage:{' '}
          <select
            value={slippageBps}
            onChange={(e) => setSlippageBps(Number(e.target.value))}
            className="bg-transparent text-white/70 outline-none"
          >
            <option value={10}>0.1%</option>
            <option value={50}>0.5%</option>
            <option value={100}>1%</option>
            <option value={300}>3%</option>
          </select>
        </div>
        <div>
          {quote ? `impact: ${(Number(quote.priceImpactPct) * 100).toFixed(2)}%` : ''}
        </div>
      </div>

      {platformFeeBps() > 0 && (
        <div className="mt-1 text-[10px] text-white/30">
          includes a {(platformFeeBps() / 100).toFixed(2)}% Backspace platform fee
        </div>
      )}

      {/* Wallet gate / submit */}
      {!walletsReady ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/60">
          Loading wallet…
        </div>
      ) : !isReady ? (
        <button
          onClick={() => provisionWallet().catch(() => undefined)}
          className="mt-3 w-full rounded-xl bg-amber-400/80 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-300"
        >
          Create Solana wallet to swap
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={buttonDisabled}
          className="mt-3 w-full rounded-xl bg-emerald-500/80 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {succeeded
            ? 'Swap submitted'
            : submitting
              ? 'Submitting…'
              : quoting
                ? 'Quoting…'
                : `Buy ${outputToken.symbol}`}
        </button>
      )}

      {error && phase === 'error' && (
        <p className="mt-2 text-xs text-rose-300">{error.message}</p>
      )}

      {signature && (
        <p className="mt-2 break-all text-xs text-emerald-300">
          submitted:{' '}
          <a
            href={`https://solscan.io/tx/${signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {signature.slice(0, 8)}…{signature.slice(-8)}
          </a>
        </p>
      )}
    </div>
  );
}
