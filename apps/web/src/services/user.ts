// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { User } from '@prisma/client';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { serverURL } from '@src/utils/common_utils';
import { HYDRATE } from 'next-redux-wrapper';

import { baseQuery } from './base';

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: baseQuery,
  extractRehydrationInfo(action, { reducerPath }) {
    if (action.type === HYDRATE) {
      return action.payload[reducerPath];
    }
  },
  tagTypes: [],
  endpoints: (builder) => ({
    getMyUserById: builder.query({
      query: (id: bigint) => `user/self?id=${id}`,
    }),
    getMyUserByAuthId: builder.query<User, string>({
      query: authId => `user/self?authId=${authId}`,
    }),
    getUserById: builder.query({
      query: (id: bigint) => `user/?id=${id}`,
    }),
    getUserByAuthId: builder.query({
      query: (authId: string) => `user/?authId=${authId}`,
    }),
    getUserByUsername: builder.query({
      query: (username: string) => `user/?username=${username}`,
    }),
    getProfileById: builder.query({
      query: (id: bigint) => `user/profile?id=${id}`,
    }),
    getProfileByUsername: builder.query({
      query: (username: string) => `user/profile?username=${username}`,
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetUserByIdQuery,
  useGetUserByAuthIdQuery,
  useGetMyUserByAuthIdQuery,
  useGetUserByUsernameQuery,
  useGetProfileByIdQuery,
  useGetProfileByUsernameQuery,
} = userApi;
