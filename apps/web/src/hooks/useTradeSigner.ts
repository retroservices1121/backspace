// Auto-resolve which EVM wallet signs trades.
//
// Rule: if the user has linked an external wallet via Privy, that wallet
// IS their trading wallet — same Safe, same approvals, same position
// history. The embedded Backspace wallet is only the signer for users
// who haven't linked anything. We don't ask the user to pick: they
// already declared their intent when they linked the wallet to their
// profile. See [[project_signer_no_picker]] for the product reasoning.
//
// When the user has multiple linked wallets (rare), the most recently
// added one wins — typically what they want, since the latest link is
// the most fresh declaration of intent.
//
// Edge cases:
//   - No linked wallets → falls back to embedded.
//   - User unlinks the wallet they were trading from mid-session →
//     hook re-evaluates and falls back to embedded silently. SessionStorage
//     for that EOA stays around in case they re-link.
//   - Multiple wallets, want to override → power-user override belongs
//     in /settings/wallet (not built yet — only build when someone asks).

import { useMemo } from 'react';

import { useWallet } from '@src/lib/wallet';
import type { EvmWallet } from '@src/lib/wallet/types';

export type TradeSigner = {
  /** The wallet that will sign trades. Null when the user is signed out
   *  or the embedded wallet hasn't provisioned yet. */
  wallet: EvmWallet | null;
  /** Convenience: true when `wallet` is a linked external wallet. UIs
   *  use this to decide whether to show the "Signing from MetaMask"
   *  caption — embedded-only users don't need disclosure. */
  isExternal: boolean;
};

export function useEvmTradeSigner(): TradeSigner {
  const { evmWallets, embeddedEvmWallet } = useWallet();

  const wallet = useMemo<EvmWallet | null>(() => {
    // Prefer the most recently added external wallet. evmWallets order
    // from Privy puts embedded first then externals in attach order, so
    // we pick the last external; if none exists, we fall back to
    // embedded.
    const externals = evmWallets.filter((w) => w.source === 'external');
    if (externals.length > 0) return externals[externals.length - 1];
    return embeddedEvmWallet;
  }, [evmWallets, embeddedEvmWallet]);

  return {
    wallet,
    isExternal: wallet?.source === 'external',
  };
}
