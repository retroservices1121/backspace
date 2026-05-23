// CDP implementation of WalletProvider.
//
// Uses cdp-hooks for the user's embedded EVM + Solana wallets, plus
// wagmi (with @coinbase/cdp-wagmi's connector for the embedded path)
// for external wallets like MetaMask / Coinbase Wallet / WalletConnect.
//
// Why both: wagmi is the ecosystem standard for external EVM wallets
// and lets us reuse mature connectors instead of writing our own. The
// CDP embedded wallet plugs in as just another wagmi connector (via
// `createCDPEmbeddedWalletConnector`), so the wagmi machinery is the
// single source of truth for "which EVM address is active" — embedded
// and external are peers.
//
// Solana stays cdp-hooks-only because wagmi is EVM-only. CDP exposes
// arbitrary Solana transaction signing through `useSignSolanaTransaction`
// + `useSendSolanaTransaction`, which is enough for Dflow swaps and
// future Phoenix orders.
//
// Sharp edges:
//   - `getEthersSigner()` returns an ethers v5 JsonRpcSigner wrapping
//     the wagmi connector's EIP-1193 provider. Polymarket clob-client-v2
//     consumes ethers v5; this is the same wrap pattern as
//     `lib/polymarket/wallet.ts` already does today.
//   - `provisionSolana()` is best-effort — CDP's Solana account exists
//     once the user has signed in; the createSolana hook is for cases
//     where the user is mid-onboarding without a Solana account yet.

import { useCallback, useMemo } from 'react';
import {
  useCurrentUser,
  useEvmAddress,
  useGetAccessToken,
  useIsInitialized,
  useIsSignedIn,
  useSignOut,
  useSolanaAddress,
  useSignSolanaMessage,
  useSignSolanaTransaction,
  useSendSolanaTransaction,
  useCreateSolanaAccount,
} from '@coinbase/cdp-hooks';
import { useAccount, useConnections, useDisconnect } from 'wagmi';

import type {
  EvmWallet,
  SolanaWallet,
  WalletProvider,
  WalletUser,
} from '../types';

/** Hook-shaped CDP adapter. Must be called inside a tree that has both
 *  <CDPHooksProvider> and <WagmiProvider> mounted (see _app.tsx). */
export function useCdpWalletProvider(): WalletProvider {
  const { isInitialized } = useIsInitialized();
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();
  const { getAccessToken } = useGetAccessToken();
  const { signOut } = useSignOut();

  // wagmi is the source of truth for which EVM accounts are connected.
  // `useConnections` returns one entry per active connector, each with
  // its addresses[]. Embedded shows up as the cdp-embedded-wallet
  // connector; externals show up as their respective connectors
  // (metaMask, coinbaseWallet, walletConnect, …).
  const connections = useConnections();
  const wagmiAccount = useAccount();
  const { disconnectAsync } = useDisconnect();

  const userShape: WalletUser | null = useMemo(() => {
    if (!currentUser) return null;
    type CdpUser = {
      userId: string;
      authenticationMethods?: Array<{ type?: string; email?: string }>;
    };
    const u = currentUser as unknown as CdpUser;
    const emailMethod = u.authenticationMethods?.find(
      (m) => m?.type === 'email' && typeof m.email === 'string',
    );
    return {
      id: u.userId,
      email: emailMethod?.email ?? null,
    };
  }, [currentUser]);

  // ─── EVM wallets (all wagmi-managed) ─────────────────────────────
  const evmWallets: EvmWallet[] = useMemo(() => {
    const out: EvmWallet[] = [];
    for (const conn of connections) {
      const isEmbedded = conn.connector.id === 'cdp-embedded-wallet';
      for (const addr of conn.accounts) {
        out.push({
          address: addr.toLowerCase(),
          source: isEmbedded ? 'embedded' : 'external',
          clientType: conn.connector.id,
          chainId: conn.chainId,
          getEthersSigner: async () => {
            const provider = await conn.connector.getProvider();
            // Lazy ethers import keeps this module bundle-friendly for
            // any non-Polymarket caller that just needs the address.
            const { providers } = await import('ethers');
            return new providers.Web3Provider(
              provider as providers.ExternalProvider,
            ).getSigner();
          },
          getEthereumProvider: () => conn.connector.getProvider(),
          switchChain: async (chainId: number) => {
            const switchFn = (conn.connector as { switchChain?: (args: { chainId: number }) => Promise<unknown> }).switchChain;
            if (switchFn) await switchFn({ chainId });
          },
        });
      }
    }
    // Embedded first for downstream auto-pick stability.
    out.sort((a, b) => (a.source === 'embedded' ? -1 : b.source === 'embedded' ? 1 : 0));
    return out;
  }, [connections]);

  const embeddedEvmWallet = useMemo(
    () => evmWallets.find((w) => w.source === 'embedded') ?? null,
    [evmWallets],
  );

  // ─── Solana (cdp-hooks only — wagmi is EVM-only) ──────────────────
  const { solanaAddress } = useSolanaAddress();
  const { signSolanaTransaction } = useSignSolanaTransaction();
  const { signSolanaMessage } = useSignSolanaMessage();
  const { sendSolanaTransaction } = useSendSolanaTransaction();
  const { createSolanaAccount } = useCreateSolanaAccount();

  const solanaWallets: SolanaWallet[] = useMemo(() => {
    if (!solanaAddress) return [];
    return [
      {
        address: solanaAddress,
        source: 'embedded',
        clientType: 'cdp',
        signTransaction: async <T,>(transaction: T): Promise<T> => {
          const result = await signSolanaTransaction({
            solanaAccount: solanaAddress,
            transaction: transaction as never,
          });
          // CDP returns the signed serialized tx; callers expecting the
          // same Transaction shape need to reconstruct. The Dflow path
          // uses signAndSendTransaction (broadcast on Coinbase RPC) so
          // this sign-only branch is mostly forward-looking.
          return (result as unknown) as T;
        },
        signAndSendTransaction: async <T,>(transaction: T): Promise<string> => {
          const result = await sendSolanaTransaction({
            solanaAccount: solanaAddress,
            transaction: transaction as never,
            // CDP supports mainnet + devnet; mainnet is the prod target.
            network: 'solana',
          });
          return (result as { transactionSignature: string }).transactionSignature;
        },
        signMessage: async (message: Uint8Array): Promise<Uint8Array> => {
          const result = await signSolanaMessage({
            solanaAccount: solanaAddress,
            message,
          });
          return (result as { signature: Uint8Array }).signature;
        },
      },
    ];
  }, [solanaAddress, signSolanaTransaction, signSolanaMessage, sendSolanaTransaction]);

  const embeddedSolanaWallet = useMemo(
    () => solanaWallets.find((w) => w.source === 'embedded') ?? null,
    [solanaWallets],
  );

  const provisionSolana = useCallback(async (): Promise<SolanaWallet> => {
    if (embeddedSolanaWallet) return embeddedSolanaWallet;
    if (!createSolanaAccount) {
      throw new Error('CDP Solana account creation hook unavailable');
    }
    await createSolanaAccount();
    // Best-effort — solanaAddress refreshes on next render. Return a
    // sentinel that callers shouldn't actually use; usual pattern is
    // to re-read useWallet() after the promise resolves.
    return embeddedSolanaWallet ?? {
      address: '',
      source: 'embedded',
      clientType: 'cdp',
      signTransaction: async () => {
        throw new Error('Wallet not ready yet');
      },
    };
  }, [embeddedSolanaWallet, createSolanaAccount]);

  // ─── Auth surface ─────────────────────────────────────────────────
  const login = useCallback(() => {
    // CDP doesn't expose a top-level "open the auth modal" function the
    // way Privy does. Sign-in UX runs through cdp-react's <SignIn />
    // component or the manual useSignInWithEmail / SMS / OAuth / SIWE
    // hooks. The app's /auth/login page mounts those directly.
    // Calling this `login` is a no-op pointer-of-intent — callers
    // route to /auth/login instead.
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Disconnect every wagmi connection first so external wallets
      // don't linger after the CDP session ends.
      await disconnectAsync().catch(() => undefined);
    } finally {
      await signOut();
    }
  }, [disconnectAsync, signOut]);

  return {
    ready: isInitialized,
    authenticated: isSignedIn,
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
