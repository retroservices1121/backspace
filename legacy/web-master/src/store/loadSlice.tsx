// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const NAMESPACE = 'load';

enum LoaderNames {
  authLoader = 'authLoader',
}

type BasicLoaders = {
  [name in LoaderNames]: boolean;
};

type LoadState = BasicLoaders;

const initialLoaderState: LoadState = {
  authLoader: false,
};

const initialState: LoadState = {
  ...initialLoaderState,
};

function toggleLoader(loaderName: keyof BasicLoaders) {
  return (state: LoadState, action: PayloadAction<boolean | undefined>) => {
    state[loaderName] = action.payload || !state[loaderName];
  };
}

const loadSlice = createSlice({
  name: NAMESPACE,
  initialState,
  reducers: {
    toggleAuthLoader: toggleLoader(LoaderNames.authLoader),
  },
  extraReducers: {

  },
});

export default loadSlice.reducer;
export const {
  toggleAuthLoader,
} = loadSlice.actions;
