// Realtime subscription for the active community channel's chat. Mirrors
// useChat (DMs) but for community channels — subscribes to the Ably
// topic the message-create route publishes to and dispatches the new
// message into the community slice.
//
// Server side: pages/api/messages/[id].ts publishes on POST.
// Client side: this hook is called by the active channel chat view.

import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { buildChannelTopic } from 'lib/ably';
import { selectCurrentChannel } from 'store/community/selectors';
import { communityActions } from 'store/community/slice';
import { useAppDispatch } from 'store/store';

import { usePubSub } from './usePubSub';

export default function useChannelChat() {
  const channel = useSelector(selectCurrentChannel);
  const dispatch = useAppDispatch();
  const pubsub = usePubSub();

  useEffect(() => {
    if (!channel?.uuid) return;
    const topic = buildChannelTopic(channel.uuid);
    console.debug(`subscribing to ${topic}`);
    pubsub.subscribe(topic, (msg) => {
      const incoming = msg?.data;
      if (!incoming) return;
      dispatch(communityActions.insertMessages([incoming]));
    });
    // The pubsub helper drops the prior handler when a duplicate
    // subscribe lands on the same topic+event, so a new channel
    // selection cleans up the old one implicitly.
  }, [channel?.uuid]);
}
