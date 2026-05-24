// Resolve which EVM wallet signs trades.
//
// Resolution order:
//   1. The user's primary trading wallet preference (set on
//      /settings/wallet) — wins when present AND still mounted.
//   2. The most recently linked external wallet — historical
//      auto-pick. See [[project_signer_no_picker]] for the original
//      product reasoning; the explicit picker is the power-user
//      override on top.
//   3. The embedded Backspace wallet.
//
// Edge cases:
//   - User picked a wallet then unlinked it → preference no longer
//     matches anything in evmWallets, falls through to auto-pick. The
//     stale preference stays in the DB until the user changes it; that's
//     fine because next time they link the same wallet it re-engages.
//   - No linked wallets and no preference → embedded.

import { useMemo } from 'react';

import { useWallet } from '@src/lib/wallet';
import type { EvmWallet } from '@src/lib/wallet/types';
import { usePrimaryTradingWallet } from './usePrimaryTradingWallet';

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
  const { address: preferredAddress } = usePrimaryTradingWallet();

  const wallet = useMemo<EvmWallet | null>(() => {
    if (preferredAddress) {
      const match = evmWallets.find(
        (w) => w.address.toLowerCase() === preferredAddress.toLowerCase(),
      );
      if (match) return match;
      // Preference is stale (wallet unlinked / not yet hydrated) —
      // fall through to auto-pick rather than blocking trading.
    }
    const externals = evmWallets.filter((w) => w.source === 'external');
    if (externals.length > 0) return externals[externals.length - 1];
    return embeddedEvmWallet;
  }, [evmWallets, embeddedEvmWallet, preferredAddress]);

  return {
    wallet,
    isExternal: wallet?.source === 'external',
  };
}
