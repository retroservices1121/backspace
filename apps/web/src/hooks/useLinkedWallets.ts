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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

async function syncLinkedWallets(address?: string): Promise<LinkedWallet[]> {
  // When `address` is provided, the server polls Privy until that
  // specific address shows up in linkedAccounts (read-after-write
  // race protection). Otherwise it just persists whatever's currently
  // attached — used as the on-mount refresh.
  const body = address ? { address } : {};
  const { data } = await axios().post<{ linked: LinkedWallet[] }>(
    '/users/me/linked-wallets',
    body,
  );
  return data.linked ?? [];
}

async function deleteLinkedWallet(id: string): Promise<void> {
  await axios().delete(`/users/me/linked-wallets/${encodeURIComponent(id)}`);
}

export function useLinkedWallets() {
  const queryClient = useQueryClient();
  const { user, unlinkWallet } = usePrivy();
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

  // Auto-recovery for the "Privy auto-linked but our DB hasn't
  // synced" case. Coinbase Wallet in particular sometimes returns
  // from connectWallet() with the address already in
  // user.linkedAccounts (so candidate filter excludes it) — and
  // Privy's user-state propagation can be slow, arriving after the
  // initial connecting phase has timed out. Runs whenever
  // linkedAddresses changes, regardless of phase, so the sync
  // happens even after the user has clicked away or seen the
  // watchdog reset.
  const syncedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const dbAddresses = new Set(
      (list.data ?? []).map((w) => w.address.toLowerCase()),
    );
    const newlyLinked = Array.from(linkedAddresses).find(
      (a) => !dbAddresses.has(a) && !syncedRef.current.has(a),
    );
    if (!newlyLinked) return;
    // Dedupe: don't re-sync the same address in a tight loop while
    // the DB query is invalidating + refetching.
    syncedRef.current.add(newlyLinked);
    setPhase('linking');
    syncLinkedWallets(newlyLinked)
      .then(() => {
        queryClient.invalidateQueries(['linked-wallets']);
        queryClient.invalidateQueries(['polymarket-positions']);
        setPhase('linked');
      })
      .catch((e) => {
        setError(e as Error);
        setPhase('idle');
        // Allow retry of this specific address on a future attempt.
        syncedRef.current.delete(newlyLinked);
      });
  }, [linkedAddresses, list.data, queryClient]);

  // Watchdog: if 'connecting' lingers past 60 seconds, reset to
  // idle so the user can retry without a page reload. Generous
  // because mobile wallet-app round-trips can legitimately take
  // 30–45s, and the auto-recovery above still fires regardless of
  // phase if Privy eventually reports the link.
  useEffect(() => {
    if (phase !== 'connecting') return;
    const timer = setTimeout(() => {
      setError(
        new Error(
          "We didn't hear back from your wallet. Try again — or refresh if it sticks.",
        ),
      );
      setPhase('idle');
    }, 60_000);
    return () => clearTimeout(timer);
  }, [phase]);

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

  const syncMutation = useMutation(
    (address?: string) => syncLinkedWallets(address),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['linked-wallets']);
        queryClient.invalidateQueries(['polymarket-positions']);
      },
    },
  );

  // Unlink flow: Privy first (so user.linkedAccounts drops the address
  // and the auto-sync effect above doesn't re-add the wallet), then
  // server soft-delete (clears the linked-polymarket source marker;
  // Trade/Position FKs keep the row alive for audit history).
  //
  // If Privy fails, we still drop our DB row — the user sees the
  // wallet leave the UI. On the next render Privy may report it as
  // linked again and the auto-sync will revive the row; the user can
  // retry. We accept that flap rather than blocking the local delete
  // on a flaky third-party call.
  const unlinkMutation = useMutation(
    async ({ id, address }: { id: string; address: string }) => {
      try {
        await unlinkWallet(address);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Privy unlinkWallet failed; proceeding with DB delete', err);
      }
      // Block the address from being immediately re-synced this
      // session even if Privy's user object hasn't refreshed yet.
      syncedRef.current.add(address.toLowerCase());
      await deleteLinkedWallet(id);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['linked-wallets']);
        queryClient.invalidateQueries(['polymarket-positions']);
      },
    },
  );

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

      // Persist to our DB + derive the Safe address. Pass the
      // address explicitly so the server can poll Privy until its
      // own read-side reflects the new link (Privy's getUser API
      // takes a beat to update after useLinkWithSiwe resolves).
      try {
        const linked = await syncMutation.mutateAsync(candidate.address);
        if (linked.length === 0) {
          // Server returned 201 with no rows — Privy confirmed the
          // wallet but our upsert produced nothing (currently only
          // happens if the address ends up owned by a different
          // Backspace user mid-flight). Surface as a real error
          // rather than reverting silently.
          throw new Error('Wallet linked on Privy but not recorded on Backspace.');
        }
      } catch (syncErr: any) {
        // Pull the server's structured error if axios attached one.
        const serverMsg = syncErr?.response?.data?.message as string | undefined;
        const errorCode = syncErr?.response?.data?.error as string | undefined;
        const wrapped = new Error(serverMsg ?? syncErr.message ?? 'Wallet sync failed');
        (wrapped as any).code = errorCode;
        throw wrapped;
      }
      setPhase('linked');
    } catch (e) {
      setError(e as Error);
      // Keep the candidate around so the user can retry without
      // re-connecting — common after wallets that auto-cancel sign
      // requests when the user takes too long to confirm. NOTE:
      // once Privy itself has linked the wallet, `candidate` will
      // become null and the effect below resets phase to 'idle' —
      // that's why `error` is the real source of truth for the UI,
      // not phase. The settings page should render `error` even in
      // the idle state.
      setPhase('pending');
      throw e;
    }
  }, [candidate, generateSiweMessage, linkWithSiwe, syncMutation]);

  const unlink = useCallback(
    (id: string, address: string) =>
      unlinkMutation.mutateAsync({ id, address }),
    [unlinkMutation],
  );

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
    unlink,
    unlinking: unlinkMutation.isLoading,
    refresh: () => queryClient.invalidateQueries(['linked-wallets']),
  };
}
