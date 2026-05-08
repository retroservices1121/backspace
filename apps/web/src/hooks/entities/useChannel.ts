// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useSelector } from 'react-redux';
import { selectChannels, selectRole } from '@src/store/community/selectors';
import { actions, SendMessagePayload } from '@src/store/community/slice';

import { useAppDispatch } from 'store/store';

/**
 * Even smaller context, even more performance
 */
export default function useChannel(id: string) {
  const channel = useSelector(selectChannels)[id];
  const role = useSelector(selectRole);

  const dispatch = useAppDispatch();
  const loadMore = () => { dispatch(actions.getMessages()); };
  const sendMessage = (payload: SendMessagePayload) => { dispatch(actions.sendMessage(payload)); };

  return {
    channel,
    role,
    run: {
      sendMessage,
      loadMore,
    },
  };
}
