// React wrapper over lib/polymarket/session. Finds the user's embedded
// EOA via useWallet(), exposes the deterministic Safe address + live
// pUSD balance immediately, and drives the one-time trading-session
// setup.
//
// Backs both the funding UI (settings/wallet) and the trade-gating in
// the market cards.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWallet } from '@src/lib/wallet';
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
import { useQuery } from 'react-query';

export function usePolymarketSession() {
  const { embeddedEvmWallet } = useWallet();
  const wallet = embeddedEvmWallet;
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
