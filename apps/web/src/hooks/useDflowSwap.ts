// useDflowSwap — React wrapper over lib/dflow's quote + execute flow.
// Exposes a state machine + the user's embedded Solana wallet so the
// swap UI (and inline post embed) stay declarative.
//
// Pricing in the Dflow quote response is short-lived; the hook keeps
// a `quote` slot and a `refresh()` so the card can re-quote between
// keystrokes without re-deriving the wallet on every change.
//
// Pulls the Solana wallet through the provider-agnostic useWallet()
// — see lib/wallet/.

import { useCallback, useState } from 'react';
import { useQueryClient } from 'react-query';

import {
  type DflowQuote,
  executeSwap,
  type GetQuoteArgs,
  previewSwap,
} from '@src/lib/dflow';
import { useWallet } from '@src/lib/wallet';
import axios from '@src/lib/axios';

export type SwapPhase =
  | 'idle'
  | 'quoting'
  | 'ready'
  | 'submitting'
  | 'success'
  | 'error';

export function useDflowSwap() {
  const { ready, embeddedSolanaWallet, provisionSolana } = useWallet();
  const wallet = embeddedSolanaWallet;
  const queryClient = useQueryClient();

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

      // Record-only audit log. Polymarket already returned the order id
      // before this point — for Dflow we have the submitted tx
      // signature; that's the dedupe key on the server. Fire-and-forget:
      // a failed audit write must not surface as a trade failure since
      // the swap already settled on-chain.
      axios()
        .post('/dflow/trades', {
          txSignature: result.signature,
          inputMint: quote.inputMint,
          inputAmount: quote.inAmount,
          outputMint: quote.outputMint,
          outputAmount: quote.outAmount,
          walletAddress: wallet.address,
        })
        .then(() => queryClient.invalidateQueries(['dflow-trades']))
        .catch(() => undefined);

      return result;
    } catch (e) {
      setError(e as Error);
      setPhase('error');
      throw e;
    }
  }, [wallet, quote, queryClient]);

  const reset = useCallback(() => {
    setQuote(null);
    setPhase('idle');
    setError(null);
    setSignature(null);
  }, []);

  // Privy's `createOnLogin` only provisions one wallet type. Backspace
  // auto-creates the Ethereum embedded wallet (Polymarket needs it), so
  // we provision Solana lazily — the first time the user opens a swap.
  // CDP's provider auto-creates both via createOnLogin:true; this call
  // is a no-op for already-provisioned wallets in either provider.
  const provisionWallet = useCallback(async () => {
    setError(null);
    try {
      await provisionSolana();
    } catch (e) {
      // Already-exists isn't really an error from the caller's POV.
      const message = (e as Error).message ?? '';
      if (!/already/i.test(message)) {
        setError(e as Error);
        throw e;
      }
    }
  }, [provisionSolana]);

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
