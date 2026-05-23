// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { QueryClient, QueryClientProvider } from 'react-query';
import { CDPHooksProvider } from '@coinbase/cdp-hooks';
import { addRpcUrlOverrideToChain, PrivyProvider } from '@privy-io/react-auth';
import { QueryClient as TanstackQueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { polygon } from 'viem/chains';
import { WagmiProvider, createConfig } from 'wagmi';
import { coinbaseWallet, metaMask, walletConnect } from 'wagmi/connectors';
import { createCDPEmbeddedWalletConnector } from '@coinbase/cdp-wagmi';

import CreatePost from '@src/components/CreatePost';
import Loading from '@src/components/Loading';
import AppWelcome from '@src/components/modals/AppWelcome';
import PostViewer from '@src/components/modals/PostViewer';
import useAuthentication from '@src/hooks/useAuthenticate';
import { useWalletSync } from '@src/hooks/useWalletSync';
import { solanaRpcUrl } from '@src/lib/dflow/config';
import { polygonRpcUrl } from '@src/lib/polymarket/config';
import { AuthStatus } from '@src/store/authSlice';
import { AppLayoutProps } from 'next/app';
import { useRouter } from 'next/router';

import Navigation from 'components/NavigationV2';
import useAttribution from 'hooks/useAttribution';
import { TryCatch } from 'lib/errorHandling';
import { authorizeNotifications } from 'lib/notification';
import ToastContainer from 'lib/ToastContainer';
import { APP } from 'pages';
import DefaultError from 'pages/errors/DefaultError';
import { wrapper } from 'store/store';
import ThemeProvider from 'styles/ThemeProvider';

import 'styles/globals.css';
import 'styles/common.css';

// ─── Provider selection (build-time, via NEXT_PUBLIC_* env vars) ─────
//
// The CDP path mounts cdp-hooks + wagmi (which the CDP-embedded-wallet
// connector and the standard external connectors share). The Privy
// path mounts the historical PrivyProvider only. Setting
// NEXT_PUBLIC_CDP_PROJECT_ID at build time flips to CDP; absence falls
// back to Privy. NEXT_PUBLIC_PRIVY_APP_ID is still consulted by the
// Privy branch so the Privy SDK boots correctly while CDP is in
// pre-rollout testing.
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const CDP_PROJECT_ID = process.env.NEXT_PUBLIC_CDP_PROJECT_ID;
const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const USE_CDP = Boolean(CDP_PROJECT_ID);

// Polymarket trades settle on Polygon, so the embedded wallet must run
// there. Override the RPC when one is configured so the wallet uses
// our endpoint rather than the public default.
const POLYGON_RPC_URL = polygonRpcUrl();
const polygonChain = POLYGON_RPC_URL
  ? addRpcUrlOverrideToChain(polygon, POLYGON_RPC_URL)
  : polygon;

// Privy's Solana support — useSolanaWallets() returns ConnectedSolanaWallet
// instances. solanaClusters tells Privy which RPC to broadcast through.
const SOLANA_RPC_URL = solanaRpcUrl();
const solanaClusters = SOLANA_RPC_URL
  ? [{ name: 'mainnet-beta' as const, rpcUrl: SOLANA_RPC_URL }]
  : undefined;

// Give JSON support for BigInts to the app
// See https://github.com/GoogleChromeLabs/jsbi/issues/30
(BigInt.prototype as any).toJSON = function () { return this.toString(); };

const EmptyLayout = ({ children }: any) => <>{children}</>;

// ─── Wagmi config (CDP path only) ────────────────────────────────────
//
// Constructed lazily — calling createConfig at module scope on a Privy
// build would still execute the CDP connector factory and pull in
// browser-only globals at SSR-eval time. The Privy branch never reads
// this.
let cachedWagmiConfig: ReturnType<typeof createConfig> | null = null;
function getWagmiConfig() {
  if (!CDP_PROJECT_ID) return null;
  if (cachedWagmiConfig) return cachedWagmiConfig;
  const cdpConnector = createCDPEmbeddedWalletConnector({
    cdpConfig: { projectId: CDP_PROJECT_ID },
    providerConfig: {
      chains: [polygonChain],
      transports: { [polygonChain.id]: http(POLYGON_RPC_URL || undefined) },
      announceProvider: true,
    },
  });
  cachedWagmiConfig = createConfig({
    chains: [polygonChain],
    connectors: [
      cdpConnector,
      coinbaseWallet({ appName: 'Backspace' }),
      metaMask(),
      ...(WC_PROJECT_ID ? [walletConnect({ projectId: WC_PROJECT_ID })] : []),
    ],
    transports: { [polygonChain.id]: http(POLYGON_RPC_URL || undefined) },
  });
  return cachedWagmiConfig;
}

// ─── App body (shared across providers) ──────────────────────────────
//
// Everything that consumes the wallet (useAuthentication, useWalletSync
// via useWallet) must render *inside* whichever provider tree is
// active. Keeping these hooks below MyApp's outer provider switch is
// what makes that work.
const AppBody = ({ Component, pageProps }: AppLayoutProps) => {
  useAttribution();
  authorizeNotifications();
  const authState = useAuthentication();
  useWalletSync();
  const router = useRouter();
  const onAuth = router.pathname.startsWith(APP.AUTH.INDEX);
  const queryClient = new QueryClient();

  const Layout = (Component as any).Layout || EmptyLayout;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TryCatch Fallback={DefaultError}>
          <Navigation>
            {/* Global Modals/Components */}
            <AppWelcome />
            <PostViewer />
            <CreatePost />

            {authState === AuthStatus.Unknown && !onAuth
              ? <Loading loading={true} />
              : <Layout><Component {...pageProps} /></Layout>
            }
            <ToastContainer />
          </Navigation>
        </TryCatch>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// ─── Outer provider switch ───────────────────────────────────────────

// Shared singleton @tanstack/react-query client for the CDP/wagmi tree.
// (Legacy `react-query` v3 still drives most of the app via the inner
// QueryClientProvider above — wagmi's v5 client only services wagmi's
// internal queries.)
const tanstackQueryClient = new TanstackQueryClient();

function CdpShell({ Component, pageProps }: AppLayoutProps) {
  const wagmiConfig = getWagmiConfig();
  if (!wagmiConfig) {
    // Shouldn't happen — CdpShell only renders when USE_CDP is true
    // and CDP_PROJECT_ID is set — but render the body without the
    // provider tree rather than blocking dev boot.
    return <AppBody Component={Component} pageProps={pageProps} />;
  }
  return (
    <CDPHooksProvider config={{ projectId: CDP_PROJECT_ID! }}>
      <WagmiProvider config={wagmiConfig}>
        <TanstackQueryClientProvider client={tanstackQueryClient}>
          <AppBody Component={Component} pageProps={pageProps} />
        </TanstackQueryClientProvider>
      </WagmiProvider>
    </CDPHooksProvider>
  );
}

function PrivyShell({ Component, pageProps }: AppLayoutProps) {
  if (!PRIVY_APP_ID) {
    // Without an app id, render bare so dev boot still works. Server
    // routes still 401 unauthenticated requests via the middleware.
    return <AppBody Component={Component} pageProps={pageProps} />;
  }
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'google', 'apple', 'wallet'],
        embeddedWallets: { createOnLogin: 'users-without-wallets' },
        appearance: { theme: 'dark', accentColor: '#5822FB' },
        defaultChain: polygonChain,
        supportedChains: [polygonChain],
        externalWallets: {
          coinbaseWallet: { connectionOptions: 'eoaOnly' },
        },
        ...(solanaClusters ? { solanaClusters } : {}),
      }}
    >
      <AppBody Component={Component} pageProps={pageProps} />
    </PrivyProvider>
  );
}

const MyApp = ({ Component, pageProps }: AppLayoutProps) => {
  return (
    <div id='root'>
      {USE_CDP
        ? <CdpShell Component={Component} pageProps={pageProps} />
        : <PrivyShell Component={Component} pageProps={pageProps} />}
    </div>
  );
};

export default wrapper.withRedux(MyApp);
