// Single entry point for wallet access across the app.
//
// Application code never imports from @privy-io/react-auth directly
// — it imports useWallet() here. Swapping the underlying provider
// (Privy → CDP, or a future addition) means changing the body of
// this hook, not touching any consumer.
//
// We intentionally do NOT thread the provider choice through env
// vars or runtime config. A wallet swap is a deliberate engineering
// event (migration UX, fund-bridging, etc.); a stray env var should
// not be able to flip the entire app's wallet stack.

import { usePrivyWalletProvider } from './providers/privy';
import type { WalletProvider } from './types';

export function useWallet(): WalletProvider {
  // Active provider. The CDP migration (task #120) replaces this
  // line with `useCdpWalletProvider()` and adds CDP's React provider
  // to apps/web/src/pages/_app.tsx.
  return usePrivyWalletProvider();
}
