// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { AsyncThunk, AsyncThunkPayloadCreator, createAsyncThunk, Dispatch } from '@reduxjs/toolkit';
import { RootState } from '@src/store/store';

type AsyncThunkConfig = {
  state?: unknown;
  dispatch?: Dispatch;
  extra?: unknown;
  rejectValue?: unknown;
  serializedErrorType?: unknown;
  pendingMeta?: unknown;
  fulfilledMeta?: unknown;
  rejectedMeta?: unknown;
};

/**
 * createAsyncThunk's function signature massively sucks for generics. This simplifies things.
 * 
 * With this simple wrapper, the first generic is the returned value, second the error value.
 * The thunk parameter is left up to the thunk function to handle.
 * RootState is now built into the function, which makes using `getState()` not require either
 * a type cast or including the generics. 
 * 
 * The first generic is now always required (unfortunately),
 * but the second aka reject (uncommonly used) value is optional. 
 * 
 * @example
 * const doSomething = createThunk<ApiResponse, string>(
 *   'aaa',
 *   async (id: string, thunkApi) => {
 *     const { data, status } = await axios().get(`api/something/${id}`);
 *     if (status === 200) return data;
 *
 *     thunkApi.rejectWithValue('doesnt work');
 *   },
 * );
 * 
 * 
 * @example 
 * const doSomething = createAsyncThunk<ApiResponse, string, { state: RootState; rejectValue: string }>(
 *   'aaa',
 *   async (id, thunkAPI) => {
 *     const { data, status } = await axios().get(`api/something/${id}`);
 *     if (status === 200) return data;
 *
 *     thunkApi.rejectWithValue('doesnt work');
 *   },
 * );
 */
export function createThunk<Returned, Rejected = unknown, Config = { state: RootState; rejectValue: Rejected }>(
  namespace: string,
  payloadCreator: AsyncThunkPayloadCreator<Returned, any, Config>,
): AsyncThunk<Returned, any, Config> {
  return createAsyncThunk<Returned, any, Config>(namespace, payloadCreator);
}


// A more complete example



// Either really long, or distractingly "tall"

// const changeChannel = createAsyncThunk<
// Normalizr<Entities>,
// string,
// { state: RootState; rejectValue: string,  }
// >(
//   `${NAMESPACE}/getChannelMessages`,
//   async (channelUuid: string, thunkAPI) => {
//   // See communitySlice2
//   },
// );


// Simple and to the point.

// const changeChannel = createThunk<Normalizr<Entities>, string>(
//   `${NAMESPACE}/getChannelMessages`,
//   async (channelUuid: string, thunkAPI) => {
//   // See communitySlice2
//   },
// );


// Potentially better

// export function createScopedThunks<RootState>(namespace: string) {
//   return <Returned, Rejected = unknown, Config = { state: RootState; rejectValue: Rejected }>(
//     thunkName: string,
//     payloadCreator: AsyncThunkPayloadCreator<Returned, any, Config>,
//   ) => createAsyncThunk<Returned, any, Config>(`${namespace}/${thunkName}`, payloadCreator);
// }

// const createThunk2 = createScopedThunks<RootState>('community');

// const doSomething = createThunk2<string>('doSomething', async (
//   payload: string, thunkAPI,
// ) => {
//   return '';
    
// },
// );