// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { QueryClient, QueryClientProvider } from 'react-query';
import { PrivyProvider } from '@privy-io/react-auth';
import CreatePost from '@src/components/CreatePost';
import Loading from '@src/components/Loading';
import AppWelcome from '@src/components/modals/AppWelcome';
import PostViewer from '@src/components/modals/PostViewer';
import useAuthentication from '@src/hooks/useAuthenticate';
import { useWalletSync } from '@src/hooks/useWalletSync';
import { AuthStatus } from '@src/store/authSlice';
import { AppLayoutProps } from 'next/app';

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

// Give JSON support for BigInts to the app
// See https://github.com/GoogleChromeLabs/jsbi/issues/30
(BigInt.prototype as any).toJSON = function () { return this.toString(); };

const EmptyLayout = ({ children }) => <>{children}</>;

const MyApp = ({ Component, pageProps } : AppLayoutProps) => {
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

  const tree = (
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

  return (
    <div id='root'>
      {PRIVY_APP_ID ? (
        <PrivyProvider
          appId={PRIVY_APP_ID}
          config={{
            loginMethods: ['email', 'google', 'apple', 'wallet'],
            embeddedWallets: { createOnLogin: 'users-without-wallets' },
            appearance: { theme: 'dark', accentColor: '#5822FB' },
          }}
        >
          {tree}
        </PrivyProvider>
      ) : (
        // Without NEXT_PUBLIC_PRIVY_APP_ID, render the tree without auth so
        // the dev server still boots. Server routes still 401 unauth requests.
        tree
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
