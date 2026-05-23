// Single entry point for wallet access across the app.
//
// Application code never imports from @privy-io/react-auth or
// @coinbase/cdp-hooks directly — it imports useWallet() here. Swapping
// the underlying provider is a one-line change in this file.
//
// Provider selection is keyed on a Next.js public env var so a Railway
// deployment can flip Privy → CDP at build time without changing code:
//   NEXT_PUBLIC_CDP_PROJECT_ID set → CDP (via cdp-hooks + wagmi)
//   else                          → Privy
//
// NEXT_PUBLIC_* env vars are inlined into the bundle at build time, so
// `USE_CDP` is a per-build constant — the conditional below never
// switches at runtime within a single page load. That keeps the
// rules-of-hooks invariant (same hooks in the same order across every
// render of the same build) intact, even though the eslint rule can't
// statically prove it.

import { useCdpWalletProvider } from './providers/cdp';
import { usePrivyWalletProvider } from './providers/privy';
import type { WalletProvider } from './types';

const USE_CDP = Boolean(process.env.NEXT_PUBLIC_CDP_PROJECT_ID);

export function useWallet(): WalletProvider {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (USE_CDP) return useCdpWalletProvider();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return usePrivyWalletProvider();
}
