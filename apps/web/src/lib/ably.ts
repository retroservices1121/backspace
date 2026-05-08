// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useSingleton } from '@src/hooks/useSingleton';
import Ably from 'ably';

//FIXME move api key
const ably = new Ably.Realtime.Promise('h0q4OQ.XGtCSA:5v7OGMCuZMayEktmzBkbKJeHypyaGhEHqD8jkmR798Y');

export enum RealtimeCategories {
  CONVERSATION = 'conversation',
  CHANNEL = 'channel',
}

export enum SubEvents {
  MESSAGE = 'message',
}

export const buildID = (topic: string, event: string = '_') => {
  return `${topic}:${event}`;
};

export const buildSubscriptionChannel = (conversationId: bigint) => {
  return `${RealtimeCategories.CONVERSATION}[${conversationId}]`;
};

useSingleton('ably_montoring', () => {
  ably.connection.on(function (stateChange) {
    console.debug('Ably connection state is ' + stateChange.current);
  });
});

export const ablyLite = () => {

  function publish(topic: string, message: any, event?: string) {
    // const id = buildID(topic, event);
    const channel = ably.channels.get(topic);
    if (event) {
      channel.publish(event, message);
    } else {
      channel.publish(message);
    }
  }

  return {
    publish,
  };

  
};

export default ably;
