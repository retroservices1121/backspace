// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Redux Store

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { Action, AnyAction, combineReducers, configureStore, ThunkAction } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import { createWrapper, HYDRATE } from 'next-redux-wrapper';
import { userApi } from 'services/user';

//import thunk from 'redux-thunk';
import appReducer from './appSlice';
import authReducer from './authSlice';
import billingReducer from './billingSlice';
import communityReducer from './community/slice';
import feedReducer from './feedSlice';
import loadReducer from './loadSlice';
import messageReducer from './messageSlice';
import modalsSlice from './modalSlice';
import postReducer from './postSlice';
import userReducer from './userSlice';
import usersSlice from './usersSlice';

/** Note: this is done so I can use maps in redux for a low-risk status tracking */
enableMapSet();

//https://stackoverflow.com/questions/70426965/how-to-use-next-redux-wrapper-with-next-js-redux-toolkit-and-typescript-p
const combinedReducer = combineReducers({
  app: appReducer,
  auth: authReducer,
  billing: billingReducer,
  community: communityReducer,
  feed: feedReducer,
  load: loadReducer,
  message: messageReducer,
  modals: modalsSlice,
  post: postReducer,
  user: userReducer,
  users: usersSlice,
  [userApi.reducerPath]: userApi.reducer,
});

//https://github.com/vahidkk/My-customized-Redux-Wrapper-for-Next.js-with-3-reducers/blob/main/store/store.js
const reducer = (state: ReturnType<typeof combinedReducer>, action: AnyAction) => {
  if (action.type === HYDRATE) {
    const nextState : ReturnType<typeof combinedReducer> = {
      ...state, // use previous state
      ...action.payload, // apply delta from hydration
    };
    return nextState;
  } else {
    return combinedReducer(state, action);
  }
};

const makeStore = () => {
  return configureStore(
    { 
      reducer,
      // We suck and use non-serializable data in our store. I'm tired of the red wall
      middleware: (getDefaultMiddleware) => {
        return getDefaultMiddleware({ serializableCheck: false })
          .concat(userApi.middleware);
      },
    },
  );
};


type StoreType = ReturnType<typeof makeStore>;
export type AppDispatch = StoreType['dispatch'];
export type RootState = ReturnType<StoreType['getState']>;
export type AppThunk<ReturnType = void> = ThunkAction<
ReturnType,
RootState,
unknown,
Action<string>
>;

export const wrapper = createWrapper(makeStore, { debug: true });

// export const persistor = persistStore(store);
//TODO Technically these should be in hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

