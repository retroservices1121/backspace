// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Main App

import Modal from 'react-modal';
import { Provider as ReduxProvider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { PersistGate } from 'redux-persist/integration/react';

import { LoadingRaw } from 'components/Loading';
import { MODAL_ROOT } from 'components/Modal/Modal';
import Navigation from 'components/NavigationV2';
import useAttribution from 'hooks/useAttribution';
import { TryCatch } from 'lib/errorHandling';
import { authorizeNotifications } from 'lib/notification';
import ToastContainer from 'lib/ToastContainer';
import Routes from 'pages';
import DefaultError from 'pages/errors/DefaultError';
import store, { history, persistor } from 'store/store';
import ThemeProvider from 'styles/ThemeProvider';

// TODO remove this
import 'util/logging';
import 'react-tabs/style/react-tabs.css';
import 'index.css';

// just in case we decide the change the root id for whatever reason...
export const ROOT_ID = 'root';
Modal.setAppElement(`#${ROOT_ID}`);

require('util/firebase');

const App = function () {
  useAttribution();

  authorizeNotifications();

  /** Explaining the order for the providers:
   * ReduxProvider
   * ThemeProvider depends on ReduxProvider
   * PersistGate has LoadingRaw which depends on themeProvider's theme
   *
   * AlertProvider & BrowserRouter have no dependencies to other providers
   */

  return (
    <ReduxProvider store={store}>
      <ThemeProvider>
        <PersistGate loading={<LoadingRaw/>} persistor={persistor}>
          <ConnectedRouter history={history}>
            <TryCatch Fallback={DefaultError}>
              <Navigation>
                  <Routes />
                  <div id={MODAL_ROOT}/>
                  <ToastContainer/>
              </Navigation>
            </TryCatch>
          </ConnectedRouter>
        </PersistGate>
      </ThemeProvider>
    </ReduxProvider>
  );
};

export default App;
