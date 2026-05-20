// Privy implementation of WalletProvider.
//
// Privy splits its surface across many hooks (usePrivy, useWallets,
// useSolanaWallets, useFundWallet, ...). This module assembles them
// into a single WalletProvider object so application code can stay
// provider-agnostic. The translation layer is intentionally thin —
// no caching, no debouncing, just shape adaptation.
//
// One sharp edge: Privy's getEthersSigner returns an ethers v5
// signer when ethers v5 is the installed peer (it is, for the
// Polymarket clob-client-v2 path). If we ever move to ethers v6
// the unified interface here stays the same; only the underlying
// peer changes.

import { useCallback, useMemo } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSolanaWallets } from '@privy-io/react-auth/solana';

import type {
  EvmWallet,
  SolanaSignable,
  SolanaWallet,
  WalletProvider,
  WalletUser,
} from '../types';

/**
 * Hook-shaped Privy adapter. Must be called inside a React tree that
 * has <PrivyProvider> mounted (apps/web/src/pages/_app.tsx).
 */
export function usePrivyWalletProvider(): WalletProvider {
  const {
    ready,
    authenticated,
    user,
    getAccessToken,
    login,
    logout,
  } = usePrivy();
  const { wallets: evmRaw } = useWallets();
  const {
    wallets: solanaRaw,
    createWallet: createSolanaWallet,
  } = useSolanaWallets();

  const userShape: WalletUser | null = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email?.address ?? user.google?.email ?? null,
    };
  }, [user]);

  // ─── EVM wallets ─────────────────────────────────────────────────
  const evmWallets: EvmWallet[] = useMemo(() => {
    return (evmRaw ?? []).map((w) => ({
      address: w.address.toLowerCase(),
      source: w.walletClientType === 'privy' ? 'embedded' : 'external',
      clientType: w.walletClientType,
      chainId: parseChainId(w.chainId),
      getEthersSigner: () => (w as any).getEthersSigner(),
    }));
  }, [evmRaw]);

  const embeddedEvmWallet = useMemo(
    () => evmWallets.find((w) => w.source === 'embedded') ?? null,
    [evmWallets],
  );

  // ─── Solana wallets ──────────────────────────────────────────────
  const solanaWallets: SolanaWallet[] = useMemo(() => {
    return (solanaRaw ?? []).map((w) => ({
      address: w.address,
      // Privy's useSolanaWallets() only surfaces embedded wallets in
      // the current SDK. External Solana connectors (Phantom etc.)
      // come through a different hook we don't use yet.
      source: 'embedded' as const,
      clientType: 'privy',
      signTransaction: async ({ transaction }: SolanaSignable) => {
        return (w as any).signTransaction(transaction);
      },
      signAndSendTransaction: async ({ transaction }: SolanaSignable) => {
        const sig = await (w as any).sendTransaction(transaction);
        return typeof sig === 'string' ? sig : (sig?.signature ?? '');
      },
      signMessage: async (message: Uint8Array) => {
        return (w as any).signMessage(message);
      },
    }));
  }, [solanaRaw]);

  const embeddedSolanaWallet = useMemo(
    () => solanaWallets.find((w) => w.source === 'embedded') ?? null,
    [solanaWallets],
  );

  const provisionSolana = useCallback(async (): Promise<SolanaWallet> => {
    if (embeddedSolanaWallet) return embeddedSolanaWallet;
    if (!createSolanaWallet) {
      throw new Error('Privy Solana wallet creation hook unavailable');
    }
    await createSolanaWallet();
    // The next render will refresh solanaWallets via the hook;
    // callers should re-read embeddedSolanaWallet after the promise
    // resolves. We return a best-effort shape from the existing list
    // since createSolanaWallet's return type varies across Privy
    // versions and isn't reliably the new wallet itself.
    return (
      solanaWallets[0] ?? {
        address: '',
        source: 'embedded',
        clientType: 'privy',
        signTransaction: async () => {
          throw new Error('Wallet not ready yet');
        },
      }
    );
  }, [embeddedSolanaWallet, createSolanaWallet, solanaWallets]);

  return {
    ready,
    authenticated,
    user: userShape,
    getAccessToken,
    login,
    logout,
    evmWallets,
    embeddedEvmWallet,
    solanaWallets,
    embeddedSolanaWallet,
    provisionSolana,
  };
}

function parseChainId(raw: unknown): number | undefined {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw !== 'string') return undefined;
  // Privy returns chain ids as CAIP-2 strings ('eip155:137'). Strip
  // the prefix; fall back to raw parseInt for already-numeric strings.
  const colon = raw.indexOf(':');
  const tail = colon >= 0 ? raw.slice(colon + 1) : raw;
  const n = parseInt(tail, 10);
  return Number.isFinite(n) ? n : undefined;
}
