// Signer selection for EVM trading flows (Polymarket today, AGG +
// other EVM venues later). The user picks which wallet signs orders —
// the embedded Backspace wallet, or any external wallet they've
// linked via Privy's connector layer.
//
// Why this hook exists: an existing Polymarket trader who linked their
// wallet already has a deployed Safe + token approvals + on-chain
// position history. Forcing them to trade from a fresh embedded wallet
// would fragment that history and require a funding bridge. Letting
// them pick the linked wallet skips all of that — the only "setup"
// step they hit is one API-creds signature (Polymarket's L2 auth is
// per-origin).
//
// Persistence: last choice survives via localStorage so a returning
// user doesn't have to re-pick on every market they open. A more
// durable upgrade (User.primaryTradingWallet column) belongs in a
// later phase; localStorage is enough for v1 and avoids a migration.
//
// Stale-selection handling: if the stored address is no longer in the
// wallet list (user unlinked, switched Privy accounts, etc.), we fall
// back to the embedded wallet silently rather than erroring. The
// stored choice gets overwritten the next time the user picks.

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useWallet } from '@src/lib/wallet';
import type { EvmWallet } from '@src/lib/wallet/types';

const STORAGE_KEY_EVM = 'backspace.trade.signer.evm';

export type EvmTradeSigner = {
  /** Every EVM wallet attached to the caller, embedded first. */
  candidates: EvmWallet[];
  /** Currently selected signer. Null until `ready` is true (avoids
   *  the SSR + hydration flicker of "wrong wallet" on first paint). */
  selected: EvmWallet | null;
  /** False until the hook has read localStorage + resolved the
   *  selection. UIs should treat this as the loading state. */
  ready: boolean;
  /** Pick a wallet. Persists the choice in localStorage. */
  setSelected: (w: EvmWallet | null) => void;
};

export function useEvmTradeSigner(): EvmTradeSigner {
  const { evmWallets, embeddedEvmWallet } = useWallet();

  // Mount-time read from localStorage. Initialised to null so SSR /
  // pre-hydration renders agree on "no choice yet" rather than
  // flashing the embedded wallet then switching.
  const [storedAddress, setStoredAddress] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setStoredAddress(window.localStorage.getItem(STORAGE_KEY_EVM));
    setReady(true);
  }, []);

  // Resolve the stored address against the live wallet list. If the
  // user has unlinked the wallet since their last visit, the stored
  // value silently falls back to embedded.
  const selected = useMemo<EvmWallet | null>(() => {
    if (!ready) return null;
    if (storedAddress) {
      const hit = evmWallets.find(
        (w) => w.address.toLowerCase() === storedAddress.toLowerCase(),
      );
      if (hit) return hit;
    }
    return embeddedEvmWallet;
  }, [ready, storedAddress, evmWallets, embeddedEvmWallet]);

  const setSelected = useCallback((w: EvmWallet | null) => {
    const next = w?.address ?? null;
    setStoredAddress(next);
    if (typeof window === 'undefined') return;
    if (next) window.localStorage.setItem(STORAGE_KEY_EVM, next);
    else window.localStorage.removeItem(STORAGE_KEY_EVM);
  }, []);

  return { candidates: evmWallets, selected, ready, setSelected };
}
