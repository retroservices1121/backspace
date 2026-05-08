// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import createParamSelector from '@src/hooks/createParamSelector';

import { RootState } from 'store/store';

export const selectUsers = (state: RootState) => state.users;

export const useUserById = createParamSelector((state: RootState, userId: string) => {
  return state.users.users[userId];
});
