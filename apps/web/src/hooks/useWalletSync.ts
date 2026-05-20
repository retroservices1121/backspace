// Subscribes to the wallet provider's wallet set and POSTs the full list
// to /api/wallets whenever it changes. Server treats the body as
// authoritative (upserts new wallets, deletes ones no longer in the
// set).
//
// Safe to call from any authenticated React tree — multiple mounts dedupe
// on the JSON-stringified payload.

import { useEffect, useRef } from 'react';
import { useWallet } from '@src/lib/wallet';
import axios from '@src/lib/axios';

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
  const lastSentRef = useRef<string>('');

  useEffect(() => {
    if (!ready || !authenticated) return;

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

    const fingerprint = JSON.stringify(wallets);
    if (fingerprint === lastSentRef.current) return;

    lastSentRef.current = fingerprint;
    axios()
      .post('/wallets', { wallets })
      .catch((e) => console.error('wallet sync failed', e));
  }, [ready, authenticated, evmWallets, solanaWallets]);
}
