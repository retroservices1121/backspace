// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Redux Store

import { useDispatch } from 'react-redux';
import { applyMiddleware, combineReducers, compose, createStore } from '@reduxjs/toolkit';
import { connectRouter, routerMiddleware } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import { enableMapSet } from 'immer';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import thunk from 'redux-thunk';

import { crashMiddleware } from 'lib/errorHandling';
import modalSlice from 'lib/Modal/modalSlice';
import appReducer from 'store/appSlice';
import communityReducer from 'store/communitySlice';
import directMessageReducer from 'store/directMessageSlice';
import feedReducer from 'store/feedSlice';
import loadReducer from 'store/loadSlice';
import networkReducer from 'store/networkSlice';
import notificationsReducer from 'store/notificationsSlice';
import userReducer from 'store/userSlice';

import usersSlice from './usersSlice';

/**
 * To get connected-react-router to work, store needed to be setup with the manual redux way
 */
// Persist the bare minimum
const persistedUserReducer = persistReducer({ key: 'user', storage, whitelist: ['id', 'onboarded', 'isLoggedIn', 'isWelcomed', 'access_code'] }, userReducer);
// channel_messages is blacklisted to prevent data leak on restricted channels into local storage
const persistedCommunityReducer = persistReducer({ key: 'community', storage, whitelist: ['id', 'activeChannelIndex'] }, communityReducer); //TODO This might present a risk
const persistedAppReducer = persistReducer({ key: 'app', storage, whitelist: ['theme'] }, appReducer);

export const history = createBrowserHistory();

// @ts-ignore Trust me, this is safe :)
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

/**TODO this is done so I can use maps in redux for a low-risk status tracking */
enableMapSet();

const store = createStore(
  combineReducers({
    router: connectRouter(history),
    app: persistedAppReducer,
    load: loadReducer,
    user: persistedUserReducer,
    users: usersSlice,
    community: persistedCommunityReducer,
    directMessage: directMessageReducer,
    feed: feedReducer,
    notifications: notificationsReducer,
    modals: modalSlice,
    network: networkReducer,
  }),
  composeEnhancers(
    applyMiddleware(
      routerMiddleware(history),
      thunk,
      crashMiddleware,
    ),
  ),
);

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();

export default store;
