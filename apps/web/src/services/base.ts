// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { fetchBaseQuery } from '@reduxjs/toolkit/dist/query';
import { RootState } from '@src/store/store';

// Create our baseQuery instance
export const baseQuery = fetchBaseQuery({
  baseUrl: '/api/',
  prepareHeaders: (headers, { getState }) => {
    // By default, if we have a token in the store, let's use that for authenticated requests
    const token = (getState() as RootState).auth.user?.getIdToken();
    if (token) {
      headers.set('authentication', `${token}`);
    }
    return headers;
  },
});