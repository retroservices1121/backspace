// Explicit two-step wallet-linking flow built for mobile reliability.
//
// Privy's `useLinkAccount().linkWallet()` is a one-modal wrapper that
// does connect → SIWE message → sign → link all behind the scenes.
// It works on desktop. On mobile it doesn't: the OS app switch
// (browser → wallet → browser) blows away Privy's internal flow
// state after the connect step, so the sign prompt never fires and
// the user comes back to a silent screen.
//
// Privy's official answer for that case is the lower-level pair:
//   - useConnectWallet()  → "just connect the wallet"
//   - useLinkWithSiwe()   → "given a signed SIWE message, attach
//                            the wallet to the Privy user"
//
// We drive that pair explicitly here. After connect, we detect any
// connected wallet that ISN'T yet in `user.linkedAccounts` and
// expose it as the `candidate`. The settings page then shows a
// "Sign to finish linking" button — a deliberate user gesture that
// re-deep-links to the wallet for the signature. No silent state.
//
// State machine:
//   idle       — initial
//   connecting — connectWallet() called, waiting for return
//   pending    — wallet connected, awaiting signature gesture
//   signing    — user tapped Sign, waiting for wallet signature
//   linking    — have signature, calling Privy + our sync endpoint
//   linked     — done

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useConnectWallet,
  useLinkWithSiwe,
  usePrivy,
  useWallets,
} from '@privy-io/react-auth';
import { useMutation, useQuery, useQueryClient } from 'react-query';

import axios from '@src/lib/axios';

export type LinkedWallet = {
  id: string;
  address: string;
  safeAddress: string | null;
  linkedAt: string;
};

export type LinkPhase =
  | 'idle'
  | 'connecting'
  | 'pending'
  | 'signing'
  | 'linking'
  | 'linked';

async function fetchLinkedWallets(): Promise<LinkedWallet[]> {
  const { data } = await axios().get<LinkedWallet[]>('/users/me/linked-wallets');
  return data ?? [];
}

async function syncLinkedWallets(): Promise<LinkedWallet[]> {
  // Empty body — server reads Privy's authoritative linked-accounts
  // list and persists whatever's attached. Used both after a fresh
  // link AND as a refresh on settings page mount.
  const { data } = await axios().post<{ linked: LinkedWallet[] }>(
    '/users/me/linked-wallets',
    {},
  );
  return data.linked ?? [];
}

export function useLinkedWallets() {
  const queryClient = useQueryClient();
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [phase, setPhase] = useState<LinkPhase>('idle');
  const [error, setError] = useState<Error | null>(null);

  const list = useQuery(['linked-wallets'], fetchLinkedWallets, {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60_000,
  });

  // The set of external wallet addresses already attached to the
  // Privy user. Anything in useWallets() that isn't here is fresh
  // from a connect step and waiting to be signed-and-linked.
  const linkedAddresses = useMemo(() => {
    const out = new Set<string>();
    for (const a of user?.linkedAccounts ?? []) {
      if ((a as { type?: string }).type === 'wallet'
        && (a as { walletClientType?: string }).walletClientType !== 'privy'
        && typeof (a as { address?: string }).address === 'string') {
        out.add(((a as { address: string }).address).toLowerCase());
      }
    }
    return out;
  }, [user]);

  // The wallet we'd sign with to finish the link. Prefer the most
  // recently connected one (last in array) so a user reconnecting
  // after a failure can still progress.
  const candidate = useMemo(() => {
    const external = wallets.filter((w) => w.walletClientType !== 'privy');
    const unlinked = external.filter((w) => !linkedAddresses.has(w.address.toLowerCase()));
    return unlinked[unlinked.length - 1] ?? null;
  }, [wallets, linkedAddresses]);

  // When a candidate appears (user just came back from a successful
  // connect), advance the phase so the UI shows the Sign button.
  useEffect(() => {
    if (candidate && (phase === 'connecting' || phase === 'idle')) {
      setPhase('pending');
    }
    if (!candidate && phase === 'pending') {
      // Candidate vanished (e.g. wallet disconnected mid-flow) —
      // reset so the user can start fresh.
      setPhase('idle');
    }
  }, [candidate, phase]);

  const { connectWallet } = useConnectWallet({
    onError: (err) => {
      setError(err instanceof Error ? err : new Error(String(err)));
      setPhase('idle');
    },
  });
  const { generateSiweMessage, linkWithSiwe } = useLinkWithSiwe({
    onError: (err) => {
      setError(err instanceof Error ? err : new Error(String(err)));
      setPhase('idle');
    },
  });

  const syncMutation = useMutation(syncLinkedWallets, {
    onSuccess: () => {
      queryClient.invalidateQueries(['linked-wallets']);
      queryClient.invalidateQueries(['polymarket-positions']);
    },
  });

  /** Step 1: open the Privy modal, deep-link to the wallet, get the
   *  user back with an active connection. After this resolves, the
   *  effect above flips phase → 'pending' and the UI renders the
   *  Sign button. */
  const startLinking = useCallback(() => {
    setError(null);
    setPhase('connecting');
    connectWallet();
  }, [connectWallet]);

  /** Step 2: SIWE message → wallet signature → Privy attach → server
   *  sync. Triggered by an explicit user tap on the Sign button so
   *  the second app-switch (browser → wallet → browser) has a fresh
   *  gesture context, not a stale auto-trigger. */
  const finishLinking = useCallback(async () => {
    if (!candidate) {
      const err = new Error('No connected wallet to link');
      setError(err);
      throw err;
    }
    setError(null);
    setPhase('signing');
    try {
      // candidate.chainId is CAIP-2 ('eip155:137'). Privy's SIWE
      // helpers expect the same format.
      const chainId = candidate.chainId || 'eip155:137';
      const message = await generateSiweMessage({
        address: candidate.address,
        chainId,
      });

      const provider = await candidate.getEthereumProvider();
      const signature = (await provider.request({
        method: 'personal_sign',
        params: [message, candidate.address],
      })) as string;

      setPhase('linking');
      await linkWithSiwe({
        signature,
        message,
        chainId,
        walletClientType: candidate.walletClientType,
        connectorType: candidate.connectorType,
      });

      // Persist to our DB + derive the Safe address.
      await syncMutation.mutateAsync();
      setPhase('linked');
    } catch (e) {
      setError(e as Error);
      // Keep the candidate around so the user can retry without
      // re-connecting — common after wallets that auto-cancel sign
      // requests when the user takes too long to confirm.
      setPhase('pending');
      throw e;
    }
  }, [candidate, generateSiweMessage, linkWithSiwe, syncMutation]);

  return {
    wallets: list.data ?? [],
    isLoading: list.isLoading,
    isError: list.isError,
    /** When non-null, a connected external wallet is waiting to be
     *  signed. The UI should surface 'Sign to finish linking'. */
    candidate,
    phase,
    error,
    startLinking,
    finishLinking,
    refresh: () => queryClient.invalidateQueries(['linked-wallets']),
  };
}
