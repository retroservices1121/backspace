// React wrapper over lib/polymarket/session. Resolves to a target EOA
// (the user's embedded wallet by default, or a passed-in linked wallet)
// and exposes the deterministic Safe address + live pUSD balance + the
// one-time trading-session setup keyed on that EOA.
//
// Per-EOA state: `loadStoredSession` is keyed on the EOA address, so an
// embedded wallet and a linked Coinbase Wallet maintain independent
// sessions. Switching the signer just re-reads from sessionStorage —
// no setup re-run unless the new wallet hasn't been initialized yet.
// For an existing Polymarket user linking their wallet, the Safe is
// already deployed and approved on-chain so init is one signature.
//
// Backs both the funding UI (settings/wallet, which always reads the
// embedded session) and the trade-gating in the market cards (which
// pass the user's currently selected signer).
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';

import {
  clearStoredSession,
  deriveSafeAddress,
  getClobClientForSession,
  getCollateralBalance,
  initializeSession,
  loadStoredSession,
  type PolymarketSession,
  type SessionStep,
} from '@src/lib/polymarket';
import { useWallet } from '@src/lib/wallet';
import type { EvmWallet } from '@src/lib/wallet/types';

export function usePolymarketSession(targetWallet?: EvmWallet | null) {
  const { embeddedEvmWallet } = useWallet();
  // Fall back to the embedded wallet so existing call sites (settings
  // funding UI, anything that doesn't yet pass a signer) keep working
  // unchanged. Explicit `null` from a caller also lands here — they
  // wanted "no wallet selected", we serve the embedded default.
  const wallet = targetWallet ?? embeddedEvmWallet;
  const eoaAddress = wallet?.address;

  const [session, setSession] = useState<PolymarketSession | null>(null);
  const [step, setStep] = useState<SessionStep>('idle');
  const [error, setError] = useState<Error | null>(null);

  // Restore a stored session whenever the wallet changes.
  useEffect(() => {
    if (!eoaAddress) {
      setSession(null);
      setStep('idle');
      return;
    }
    const stored = loadStoredSession(eoaAddress);
    setSession(stored);
    setStep(stored ? 'complete' : 'idle');
  }, [eoaAddress]);

  // The Safe address is deterministic — derivable before any setup, so
  // the funding UI can show a deposit address right away.
  const safeAddress = useMemo(() => {
    if (!eoaAddress) return undefined;
    try {
      return deriveSafeAddress(eoaAddress);
    } catch {
      return undefined;
    }
  }, [eoaAddress]);

  const { data: balance } = useQuery(
    ['polymarket-collateral', safeAddress],
    () => getCollateralBalance(safeAddress as string),
    { enabled: !!safeAddress, refetchInterval: 15_000 },
  );

  const initialize = useCallback(async () => {
    if (!wallet) {
      setError(new Error('No embedded wallet found — log in first.'));
      return;
    }
    setError(null);
    try {
      const established = await initializeSession(wallet, setStep);
      setSession(established);
    } catch (e) {
      setError(e as Error);
      setStep('idle');
    }
  }, [wallet]);

  const reset = useCallback(() => {
    if (eoaAddress) clearStoredSession(eoaAddress);
    setSession(null);
    setStep('idle');
    setError(null);
  }, [eoaAddress]);

  // Builds the authenticated CLOB client for the established session —
  // call this at trade time.
  const getClobClient = useCallback(() => {
    if (!wallet || !session) {
      throw new Error('Trading session is not ready');
    }
    return getClobClientForSession(wallet, session);
  }, [wallet, session]);

  return {
    eoaAddress,
    safeAddress,
    session,
    step,
    error,
    isReady: !!session,
    collateralBalance: balance?.formatted ?? null,
    initialize,
    reset,
    getClobClient,
  };
}
