// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useSelector } from 'react-redux';

import axios from 'lib/axios';
import { selectUser } from 'store/user/selectors';
import memoize from 'utils/memo';

import useMedia from './useMedia';

// Note! Selectors should not be used outside of hooks for abstraction purposes.
const getUser = (id: bigint) => axios().get(`user?id=${id}`); 
const memoizedGetUser = memoize(getUser);

export function getUserById(id: bigint, useCache : boolean = true) {
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetUser.clear(id);
  }
  return memoizedGetUser(id);
}

// TODO remove re-export
export { useUserById } from 'store/users/selectors';

export default function useUser() {
  // const dispatch = useAppDispatch();
  const user = useSelector(selectUser);
  const avatar = useMedia(user?.avatar);

  return {
    user,
    avatar,
  };
}