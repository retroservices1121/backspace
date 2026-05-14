// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { QueryClient, QueryClientProvider } from 'react-query';
import { addRpcUrlOverrideToChain, PrivyProvider } from '@privy-io/react-auth';
import CreatePost from '@src/components/CreatePost';
import Loading from '@src/components/Loading';
import AppWelcome from '@src/components/modals/AppWelcome';
import PostViewer from '@src/components/modals/PostViewer';
import useAuthentication from '@src/hooks/useAuthenticate';
import { useWalletSync } from '@src/hooks/useWalletSync';
import { polygonRpcUrl } from '@src/lib/polymarket/config';
import { AuthStatus } from '@src/store/authSlice';
import { AppLayoutProps } from 'next/app';
import { polygon } from 'viem/chains';

import Navigation from 'components/NavigationV2';
import useAttribution from 'hooks/useAttribution';
import { TryCatch } from 'lib/errorHandling';
import { authorizeNotifications } from 'lib/notification';
import ToastContainer from 'lib/ToastContainer';
import DefaultError from 'pages/errors/DefaultError';
import { wrapper } from 'store/store';
import ThemeProvider from 'styles/ThemeProvider';

import 'styles/globals.css';
import 'styles/common.css';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

// Polymarket trades settle on Polygon, so the Privy embedded wallet
// must run there. Override the RPC when one is configured so the
// wallet uses our endpoint rather than the public default.
const POLYGON_RPC_URL = polygonRpcUrl();
const polygonChain = POLYGON_RPC_URL
  ? addRpcUrlOverrideToChain(polygon, POLYGON_RPC_URL)
  : polygon;

// Give JSON support for BigInts to the app
// See https://github.com/GoogleChromeLabs/jsbi/issues/30
(BigInt.prototype as any).toJSON = function () { return this.toString(); };

const EmptyLayout = ({ children }) => <>{children}</>;

// Everything that consumes Privy (useAuthentication, useWalletSync via
// usePrivy) must render *inside* <PrivyProvider>. Keeping these hooks in
// MyApp's body put them above the provider MyApp itself renders, so
// usePrivy() never saw it — `ready` stayed false and the app was stuck
// on <Loading> forever. This inner component is the provider's child.
const AppBody = ({ Component, pageProps } : AppLayoutProps) => {
  useAttribution();
  authorizeNotifications();
  const authState = useAuthentication();
  useWalletSync();
  //Remove me eventually
  const queryClient = new QueryClient();
  // useEffect(() => {
  //   const DirectMessage = supabase
  //     .from('DirectMessage')
  //     .on('*', payload => {
  //       console.log('Change received!', payload);
  //     })
  //     .subscribe();
  // }, []);
  // console.log(createAxios(cookie.get(authTokenName)).get('user?id=37'));
  // const [authLoad, setAuthLoad] = useState(true);
  
  /** Explaining the order for the providers:
   * ReduxProvider (via wrapper.withRedux)
   * ThemeProvider depends on ReduxProvider
   * <OBE> PersistGate has LoadingRaw which depends on themeProvider's theme
   */

  //NOTE: This allows for pages to declare thier own layout outside of the navbar
  //Source: https://www.youtube.com/watch?v=69-mnojSa0M
  const Layout = Component.Layout || EmptyLayout;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TryCatch Fallback={DefaultError}>
          <Navigation>
            {/* Global Modals/Components */}
            <AppWelcome/>
            <PostViewer />
            <CreatePost />

            {authState === AuthStatus.Unknown
              ? <Loading loading={true}/>
              : <Layout><Component {...pageProps} /></Layout>
            }
            <ToastContainer/>
          </Navigation>
        </TryCatch>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const MyApp = ({ Component, pageProps } : AppLayoutProps) => {
  return (
    <div id='root'>
      {PRIVY_APP_ID ? (
        <PrivyProvider
          appId={PRIVY_APP_ID}
          config={{
            loginMethods: ['email', 'google', 'apple', 'wallet'],
            embeddedWallets: { createOnLogin: 'users-without-wallets' },
            appearance: { theme: 'dark', accentColor: '#5822FB' },
            defaultChain: polygonChain,
            supportedChains: [polygonChain],
          }}
        >
          <AppBody Component={Component} pageProps={pageProps} />
        </PrivyProvider>
      ) : (
        // Without NEXT_PUBLIC_PRIVY_APP_ID, render without the provider so
        // the dev server still boots. Server routes still 401 unauth requests.
        <AppBody Component={Component} pageProps={pageProps} />
      )}
    </div>
  );
};

//Works but slows down every navigation with a server request
// MyApp.getInitialProps = async (appContext) => {
//   const { ctx } = appContext;
//   const { firebaseToken } = cookies(ctx);
//   console.log('firebaseToken is: ', firebaseToken);
//   if (firebaseToken) {
//     try {
//       const headers = buildAuthHeader(firebaseToken);
//       // const result = await fetch(`${serverURL}/api/validate`, { headers }).then((res) => res.json());
//       const result = await fetch('api/validate', { headers }).then((res) => res.json());
//       return { ...result };
//     } catch (e) {
//       console.error(e);
//     }
//   }
//   return {};
// };

export default wrapper.withRedux(MyApp);
