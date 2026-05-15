// useDflowSwap — React wrapper over lib/dflow's quote + execute flow.
// Exposes a state machine + the user's embedded Solana wallet so the
// swap UI (and inline post embed) stay declarative.
//
// Pricing in the Dflow quote response is short-lived; the hook keeps
// a `quote` slot and a `refresh()` so the card can re-quote between
// keystrokes without re-deriving the wallet on every change.

import { useCallback, useMemo, useState } from 'react';
import { useSolanaWallets } from '@privy-io/react-auth';

import {
  type DflowQuote,
  executeSwap,
  type GetQuoteArgs,
  pickEmbeddedSolanaWallet,
  previewSwap,
} from '@src/lib/dflow';

export type SwapPhase =
  | 'idle'
  | 'quoting'
  | 'ready'
  | 'submitting'
  | 'success'
  | 'error';

export function useDflowSwap() {
  const { wallets, ready, createWallet } = useSolanaWallets();
  const wallet = useMemo(() => pickEmbeddedSolanaWallet(wallets), [wallets]);

  const [quote, setQuote] = useState<DflowQuote | null>(null);
  const [phase, setPhase] = useState<SwapPhase>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const refreshQuote = useCallback(async (args: GetQuoteArgs) => {
    setError(null);
    setPhase('quoting');
    try {
      const next = await previewSwap(args);
      setQuote(next);
      setPhase('ready');
      return next;
    } catch (e) {
      setError(e as Error);
      setPhase('error');
      throw e;
    }
  }, []);

  const submit = useCallback(async () => {
    if (!wallet) {
      const err = new Error('Connect a Solana wallet to swap.');
      setError(err);
      setPhase('error');
      throw err;
    }
    if (!quote) {
      const err = new Error('Refresh the quote before submitting.');
      setError(err);
      setPhase('error');
      throw err;
    }
    setError(null);
    setPhase('submitting');
    try {
      const result = await executeSwap({ wallet, quote });
      setSignature(result.signature);
      setPhase('success');
      return result;
    } catch (e) {
      setError(e as Error);
      setPhase('error');
      throw e;
    }
  }, [wallet, quote]);

  const reset = useCallback(() => {
    setQuote(null);
    setPhase('idle');
    setError(null);
    setSignature(null);
  }, []);

  // Privy's `createOnLogin` only provisions one wallet type. Backspace
  // auto-creates the Ethereum embedded wallet (Polymarket needs it), so
  // we provision Solana lazily — the first time the user opens a swap.
  const provisionWallet = useCallback(async () => {
    setError(null);
    try {
      await createWallet();
    } catch (e) {
      // Already-exists isn't really an error from the caller's POV —
      // the wallets array refresh will catch up shortly.
      const message = (e as Error).message ?? '';
      if (!/already/i.test(message)) {
        setError(e as Error);
        throw e;
      }
    }
  }, [createWallet]);

  return {
    wallet,
    walletAddress: wallet?.address ?? null,
    walletsReady: ready,
    quote,
    phase,
    error,
    signature,
    refreshQuote,
    submit,
    reset,
    provisionWallet,
    isReady: !!wallet,
  };
}
