// Subscribes to the wallet provider's wallet set and POSTs the full list
// to /api/wallets whenever it changes. Server treats the body as
// authoritative — see api/wallets for the empty-body guard.
//
// Safe to call from any authenticated React tree. Dedupes by the
// JSON-stringified payload across multiple mounts.
//
// Two gates beyond "authenticated":
//   1. fetchAttempted — redux flips this true only after useAuthenticate
//      has called setAuthCookie + autoLogin. POSTing before that races
//      the cookie write and hits the requireAuth middleware with a 401.
//   2. payload.length > 0 — wallet hooks (useWallets/useSolanaWallets)
//      populate on a later render than the authenticated flag.
//      Skipping empty POSTs avoids a momentary "delete all my wallets"
//      that the server would otherwise honour as authoritative state.

import { useEffect, useRef } from 'react';
import { useWallet } from '@src/lib/wallet';
import axios from '@src/lib/axios';
import { RootState, useAppSelector } from '@src/store/store';

type WalletPayload = {
  chain: string;
  address: string;
  custodial: boolean;
};

export function useWalletSync() {
  const {
    ready,
    authenticated,
    evmWallets,
    solanaWallets,
  } = useWallet();
  const fetchAttempted = useAppSelector(
    (s: RootState) => s.user.fetchAttempted,
  );
  const lastSentRef = useRef<string>('');

  useEffect(() => {
    if (!ready || !authenticated || !fetchAttempted) return;

    const wallets: WalletPayload[] = [
      ...evmWallets.map((w) => ({
        chain: 'ethereum',
        address: w.address,
        custodial: w.source === 'embedded',
      })),
      ...solanaWallets.map((w) => ({
        chain: 'solana',
        address: w.address,
        custodial: w.source === 'embedded',
      })),
    ];

    // No wallets to report yet — skip rather than sending an empty
    // payload the server would (if not guarded) treat as a delete-all.
    if (wallets.length === 0) return;

    const fingerprint = JSON.stringify(wallets);
    if (fingerprint === lastSentRef.current) return;

    lastSentRef.current = fingerprint;
    axios()
      .post('/wallets', { wallets })
      .catch((e) => console.error('wallet sync failed', e));
  }, [ready, authenticated, fetchAttempted, evmWallets, solanaWallets]);
}
