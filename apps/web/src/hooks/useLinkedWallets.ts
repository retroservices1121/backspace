// Wraps Privy's useLinkAccount + our /api/users/me/linked-wallets
// endpoint to provide a single hook for the settings UI.
//
// Flow:
//   1. Caller invokes `link()` — opens Privy's modal, user attaches
//      a Phantom/MetaMask/Coinbase wallet, signs proof of ownership.
//   2. Privy's onSuccess callback fires once the link is verified.
//   3. We POST /api/users/me/linked-wallets — the server re-reads
//      the caller's Privy user record and persists every external
//      wallet (and pre-computes the Polymarket Safe address).
//   4. List query refetches so the UI updates without a refresh.

import { useCallback } from 'react';
import { useLinkAccount } from '@privy-io/react-auth';
import { useQuery, useQueryClient } from 'react-query';

import axios from '@src/lib/axios';

export type LinkedWallet = {
  id: string;
  address: string;
  safeAddress: string | null;
  linkedAt: string;
};

async function fetchLinkedWallets(): Promise<LinkedWallet[]> {
  const { data } = await axios().get<LinkedWallet[]>('/users/me/linked-wallets');
  return data ?? [];
}

async function syncLinkedWallets(): Promise<LinkedWallet[]> {
  // Empty body — server reads Privy's authoritative linked-accounts
  // list and persists everything currently attached. Treats this as
  // a "sync, don't add" request.
  const { data } = await axios().post<{ linked: LinkedWallet[] }>(
    '/users/me/linked-wallets',
    {},
  );
  return data.linked ?? [];
}

export function useLinkedWallets() {
  const queryClient = useQueryClient();

  const list = useQuery(['linked-wallets'], fetchLinkedWallets, {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60_000,
  });

  const { linkWallet } = useLinkAccount({
    onSuccess: async () => {
      // Privy says the link succeeded; tell the server to refresh
      // and invalidate the list so the row appears in the UI.
      try {
        await syncLinkedWallets();
      } catch {
        // The list query will catch up on next refetch even if this
        // sync POST fails (e.g. transient network blip).
      }
      queryClient.invalidateQueries(['linked-wallets']);
      queryClient.invalidateQueries(['polymarket-positions']);
    },
  });

  const link = useCallback(() => {
    linkWallet();
  }, [linkWallet]);

  return {
    wallets: list.data ?? [],
    isLoading: list.isLoading,
    isError: list.isError,
    link,
    refresh: () => queryClient.invalidateQueries(['linked-wallets']),
  };
}
