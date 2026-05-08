// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useState } from 'react';
import { setAuthCookie } from '@src/lib/cookies';
import { RootState, useAppSelector } from '@src/store/store';

import axios from 'lib/axios';

import useConstructor from './useConstructor';

export const useAxios = () => {
  const fbUser = useAppSelector((state: RootState) => state.auth.user);
  const [token, setToken] = useState<string>();

  /** this will refresh the token every time a new component grabs it */
  useConstructor(async () => {
    if (fbUser) {
      const temp = await fbUser.getIdToken();
      setAuthCookie(temp);
      setToken(temp);
    } else {
      setToken(undefined);
    }
  });
  /** If token is undefined, it'll try to use the cookie */
  return axios(token);
};