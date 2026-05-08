// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

//@ts-nocheck FIXME: This is a lot of work & i don't understand how to get the message in next router


import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { useDispatch } from 'react-redux';
//import { Route, useLocation } from 'react-router-dom';
import { Middleware } from '@reduxjs/toolkit';

//import { push } from 'connected-react-router';
import { APP } from 'pages';

/**
 * We've got 2 sources of errors to handle:
 *  1. React UI tree
 *  2. Redux
 *
 * From React we can very simply handle them via an error boundary.
 * From Redux however we need to handle them via a middleware.
 *
 * To make both the error handlers end up in the same place,
 * The redux middleware will send the user to CheckError with the error message in the location state
 * CheckError will use the location state to send the user to the error screen.
 */

type ErrorPageState = {
  message: string;
};

/** This component will force the error screen to open */
const CheckError: React.FC = () => {
  /*
  const location = useLocation<ErrorPageState>();
  if (location?.state?.message) {
    throw new Error(location?.state?.message);
  }
  */
  return null;
};

/** This will handle errors coming from redux */
export const crashMiddleware: Middleware = store => next => action => {
  try {
    return next(action);
  } catch (err: any) {
    console.error(err.message);
    // const state = store.getState();
    //store.dispatch(push(APP.ERRORS.DEFAULT, { message: err.message }));
  }
};


type Props = {
  Fallback: React.FC<FallbackProps>
};

/** This will catch all the errors coming from the UI tree */
export const TryCatch: React.FC<Props> = ({
  children, Fallback,
}) => {
  const dispatch = useDispatch();
  const handleGoHome = () => {
    // Dispatch additional actions to clear / reset state
    //dispatch(push(APP.INDEX));
  };
  const handleReportError = (err: Error) => {
    // TODO google analytics / other (e.g. https://sentry.io) error reporting goes here
    console.error(err.message);
  };
  return (
    <ErrorBoundary
      FallbackComponent={Fallback}
      onReset={handleGoHome}
      onError={handleReportError}
    >
      {/*<Route path={'/app/error'} component={CheckError} />*/}
      {children}
    </ErrorBoundary>
  );
};




