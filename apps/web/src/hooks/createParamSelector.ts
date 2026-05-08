// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useSelector } from 'react-redux';

import { RootState } from 'store/store';

// Technically, this is a higher-order Hook

type CustomHook<P, R> = (params: P) => R;
type ParameterizedSelector<P, R, S> = (state: S, params: P) => R;

/**
 * Returns a customized hook for selecting state based on params
 * 
 * @example
 * export const selectUserById = (userId: string, state: RootState) => {
 *   return state.community.entities.Users.byId[userId];
 * };
 *
 * const useUserById = createParamSelector(selectUserById);
 * 
 * // In a react component/hook
 * const user = useUserById('someId');
 */
export default function createParamSelector<P, R, S = RootState>(
  pSelector: ParameterizedSelector<P, R, S>,
): CustomHook<P, R> {
  return params => useSelector<S, R>(state => pSelector(state, params));
}
