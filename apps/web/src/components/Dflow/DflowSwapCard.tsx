// Standalone Dflow spot-swap card. Drops into the Dev page, a token
// detail screen, or (with `compact`) inside a post embed. Pairs a
// fixed token (chosen by the caller) against SOL — flips legs based
// on the Buy/Sell toggle, so the same card handles both directions.
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
import { useSolanaBalances } from '@src/hooks/useSolanaBalances';

import type { TokenData } from '@src/hooks/useToken';

type Props = {
  /** The token this card is anchored to. On Buy we swap SOL→token;
   *  on Sell we swap token→SOL. */
  token: TokenData;
  /** When true, drop the title row and chrome — used by PostTokenCard. */
  compact?: boolean;
};

/** Back-compat alias. The card was originally Buy-only and exposed
 *  the token under `outputToken`. Both names accepted so existing
 *  call sites keep working. */
type LegacyProps = { outputToken: TokenData; compact?: boolean };

const DEFAULT_BUY_AMOUNT = '0.05'; // 0.05 SOL — small enough to safely test live.
const QUOTE_DEBOUNCE_MS = 250;
const SOL_DECIMALS = 9;

type Side = 'BUY' | 'SELL';

export function DflowSwapCard(props: Props | LegacyProps) {
  // Resolve the token from either prop name without breaking callers.
  const token: TokenData =
    (props as Props).token ?? (props as LegacyProps).outputToken;
  const { compact } = props as { compact?: boolean };

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

  const [side, setSide] = useState<Side>('BUY');
  // Amount is always in the input token's human units — SOL for Buy,
  // `token` for Sell. We default Buy to a small SOL value so the
  // card shows a real quote on first render; Sell defaults to empty
  // so the user picks an amount aware of their balance.
  const [amount, setAmount] = useState<string>(DEFAULT_BUY_AMOUNT);
  const [slippageBps, setSlippageBps] = useState(50);

  // Read the user's SPL balance of `token` so the Sell side can show
  // their max + disable when they hold none.
  const balances = useSolanaBalances(walletAddress);
  const tokenBalance = useMemo(() => {
    if (!balances.data) return null;
    return balances.data.find((b) => b.mint === token.mint) ?? null;
  }, [balances.data, token.mint]);

  // Flip default amounts + reset signature when the user toggles
  // sides. Keeps the card honest — a stale "you receive X" from the
  // other direction would be confusing.
  const switchSide = useCallback((next: Side) => {
    if (next === side) return;
    setSide(next);
    setAmount(next === 'BUY' ? DEFAULT_BUY_AMOUNT : '');
  }, [side]);

  // Re-quote whenever side, amount, or slippage settles. Debounce
  // because keystroke-rate /quote calls would burn API quota and
  // produce flicker. Skip when the amount can't yield a valid quote.
  useEffect(() => {
    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
    const t = setTimeout(() => {
      const inputMint = side === 'BUY' ? MINT.SOL : token.mint;
      const outputMint = side === 'BUY' ? token.mint : MINT.SOL;
      const inputDecimals = side === 'BUY' ? SOL_DECIMALS : token.decimals;
      const atomic = toAtomicAmount(amount, inputDecimals);
      refreshQuote({
        inputMint,
        outputMint,
        amount: atomic,
        slippageBps,
      }).catch(() => undefined);
    }, QUOTE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [amount, slippageBps, side, token.mint, token.decimals, refreshQuote]);

  // Output amount, in the destination token's human units.
  const outAmountHuman = useMemo(() => {
    if (!quote) return null;
    const outDecimals = side === 'BUY' ? token.decimals : SOL_DECIMALS;
    return fromAtomicAmount(quote.outAmount, outDecimals);
  }, [quote, side, token.decimals]);

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

  // Sell needs a non-zero balance of the token; Buy doesn't (we just
  // need SOL, which we don't bother gating in the UI — the RPC will
  // reject an insufficient-SOL tx and surface the error).
  const sellBlocked =
    side === 'SELL' && (!tokenBalance || tokenBalance.uiAmount <= 0);

  const buttonDisabled =
    submitting || quoting || !quote || !walletAddress || succeeded || sellBlocked;

  // Display strings — the input/output legs swap based on side.
  const inputSymbol = side === 'BUY' ? 'SOL' : token.symbol;
  const outputSymbol = side === 'BUY' ? token.symbol : 'SOL';
  const outputLogo = side === 'BUY' ? token.logoURI : null;

  // Sell max — "use all of my balance". A small dust threshold isn't
  // worth modelling here; the swap RPC will reject if there's no
  // SPL token account or balance is genuinely 0.
  const setMaxSell = useCallback(() => {
    if (!tokenBalance) return;
    setAmount(tokenBalance.uiAmount.toString());
  }, [tokenBalance]);

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
          {token.logoURI && (
            <img src={token.logoURI} alt="" className="h-8 w-8 rounded-full" />
          )}
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-white">
              {token.symbol}
            </div>
            <div className="truncate text-xs text-white/50">{token.name}</div>
          </div>
          <span className="ml-auto text-[10px] uppercase tracking-widest text-white/40">
            via Dflow
          </span>
        </div>
      )}

      {/* Buy / Sell pill */}
      <div className="mb-2 inline-flex rounded-lg bg-canvas/40 border border-line p-0.5">
        {(['BUY', 'SELL'] as const).map((s) => (
          <button
            key={s}
            onClick={() => switchSide(s)}
            className={`rounded px-3 py-1 text-xs font-semibold transition ${
              side === s
                ? 'bg-brand text-ink'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

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
        {side === 'SELL' && tokenBalance && tokenBalance.uiAmount > 0 && (
          <button
            type="button"
            onClick={setMaxSell}
            className="rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-white/60 hover:border-white/30 hover:text-white"
          >
            Max
          </button>
        )}
        <span className="shrink-0 text-sm font-semibold text-white/80">
          {inputSymbol}
        </span>
      </div>

      {/* Balance hint on Sell — shows what they have to work with. */}
      {side === 'SELL' && walletAddress && (
        <div className="mt-1 text-[10px] text-white/40">
          balance:{' '}
          {balances.isLoading
            ? '…'
            : tokenBalance
              ? `${tokenBalance.uiAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${token.symbol}`
              : `0 ${token.symbol}`}
        </div>
      )}

      <div className="mt-3">
        <label className="block text-[11px] uppercase tracking-widest text-white/40">
          You receive
        </label>
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
          <div className="flex-1 text-base font-mono tabular-nums text-white">
            {quoting ? <span className="text-white/40">…</span> : (outAmountHuman ?? '—')}
          </div>
          {outputLogo && (
            <img src={outputLogo} alt="" className="h-5 w-5 rounded-full" />
          )}
          <span className="shrink-0 text-sm font-semibold text-white/80">
            {outputSymbol}
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
          className="mt-3 w-full rounded-xl bg-amber-400/80 py-2.5 text-sm font-semibold text-ink transition hover:bg-amber-300"
        >
          Create Solana wallet to swap
        </button>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={buttonDisabled}
          className="
            mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-ink
            bg-brand hover:bg-brand-2
            shadow-[0_8px_22px_-6px_rgba(88,34,251,0.55)]
            transition-colors duration-150
            disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none
          "
        >
          {succeeded
            ? 'Swap submitted'
            : submitting
              ? 'Submitting…'
              : quoting
                ? 'Quoting…'
                : sellBlocked
                  ? `No ${token.symbol} to sell`
                  : `${side === 'BUY' ? 'Buy' : 'Sell'} ${token.symbol}`}
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
