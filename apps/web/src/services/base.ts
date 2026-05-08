// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Author(s): See Git History
import { fetchBaseQuery } from '@reduxjs/toolkit/dist/query';

import { getAuthCookie } from '@src/lib/cookies';

// Privy access tokens are written to the auth cookie by useAuthenticate; lift
// them off the cookie at request time instead of pulling a Firebase user
// object out of redux.
export const baseQuery = fetchBaseQuery({
  baseUrl: '/api/',
  prepareHeaders: (headers) => {
    const token = getAuthCookie();
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});
