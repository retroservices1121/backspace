// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useSelector } from 'react-redux';
import {
  selectChannelMembers,
  selectCommunities,
  selectCurrentChannel,
} from '@src/store/community/selectors';
import { actions } from '@src/store/community/slice';

import { useAppDispatch } from 'store/store';


export default function useCommunity(id: string) {
  const community = useSelector(selectCommunities)[id];

  const dispatch = useAppDispatch();
  const changeCommunity = () => dispatch(actions.changeSelectedCommunity(id));

  return {
    community,
    changeCommunity,
  };
}

export function useCurrentCommunity() {
  const activeChannel = useSelector(selectCurrentChannel);
  const members = useSelector(selectChannelMembers);

  const dispatch = useAppDispatch();
  const leaveCommunity = () => dispatch(actions.leaveCommunity());

  return {
    activeChannel,
    members,
    actions: {
      leaveCommunity,
    },
  };
}
