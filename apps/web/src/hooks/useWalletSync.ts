// Subscribes to Privy's user.linkedAccounts and POSTs the full wallet list
// to /api/wallets whenever it changes. Server treats the body as authoritative
// (upserts new wallets, deletes ones no longer in the set).
//
// Designed to be safe to call from any authenticated React tree — multiple
// mounts will dedupe by the JSON.stringify diff guard.

import { useEffect, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import axios from '@src/lib/axios';

type WalletPayload = {
  chain: string;
  address: string;
  custodial: boolean;
};

// Privy linked-account types we care about. Anything else (email, google,
// apple) is ignored here.
type PrivyWalletAccount = {
  type: 'wallet' | 'smart_wallet';
  address: string;
  chainType?: 'ethereum' | 'solana' | string;
  walletClientType?: string; // "privy" => embedded
};

function toPayload(accounts: any[]): WalletPayload[] {
  const out: WalletPayload[] = [];
  for (const a of accounts as PrivyWalletAccount[]) {
    if (a.type !== 'wallet' && a.type !== 'smart_wallet') continue;
    if (!a.address) continue;
    const chain = (a.chainType ?? 'ethereum').toLowerCase();
    out.push({
      chain,
      address: a.address,
      custodial: a.walletClientType === 'privy',
    });
  }
  return out;
}

export function useWalletSync() {
  const { ready, authenticated, user } = usePrivy();
  const lastSentRef = useRef<string>('');

  useEffect(() => {
    if (!ready || !authenticated || !user) return;

    const wallets = toPayload(user.linkedAccounts ?? []);
    const fingerprint = JSON.stringify(wallets);
    if (fingerprint === lastSentRef.current) return;

    lastSentRef.current = fingerprint;
    axios()
      .post('/wallets', { wallets })
      .catch((e) => console.error('wallet sync failed', e));
  }, [ready, authenticated, user?.linkedAccounts]);
}
