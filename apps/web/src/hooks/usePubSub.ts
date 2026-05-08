// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Types } from 'ably';

import ably, { buildID, SubEvents } from 'lib/ably';

export type SubPubChannel = {
  id: string,
  topic: string,
  event: string,
  channel: Types.RealtimeChannelPromise
};

const subscriptionMap = new Map<string, SubPubChannel>();

export const usePubSub = () => {
  ably.connection.once('connected').then(() => console.debug('Connected to Ably!'));
  
    
  async function subscribe(topic: string, callback: (msg:any) => any, event?: SubEvents) {
    //Check we are not already subscribed on this topic & filter
    const id = buildID(topic, event);
    const match = subscriptionMap.get(id);
    if (match) { //Already subscribed to this topic and event, unsubscribe
      await match.channel.unsubscribe(event);
      subscriptionMap.set(id, undefined);
    }
    const channel = ably.channels.get(topic);
    const standardCallback = (message) => {
      console.debug(`Received a message in realtime on topic ${id}`);
      callback(message);
    };
    if (event) { //Filter on client-side
      channel.subscribe(event, standardCallback);
    } else { //Subscribe to all
      channel.subscribe(standardCallback);
    }
    //Save in map
    const newSub : SubPubChannel = {
      id,
      topic, 
      event,
      channel, 
    };
    subscriptionMap.set(id, newSub);
    return newSub;
  }

  async function unsubscribe(topic: string, event?: SubEvents) {
    const id = buildID(topic, event);
    const match = subscriptionMap.get(id);
    if (match) { //Already subscribed to this topic and event, unsubscribe
      await match.channel.unsubscribe(event);
      subscriptionMap.set(id, undefined);
    }
  }

  async function publish(topic: string, message: any, event?: SubEvents ) {
    const id = buildID(topic, event);
    //Get existing or get new
    const channel = subscriptionMap.get(id)?.channel || ably.channels.get(topic);
    if (channel) { //Already subscribed to this topic and event, unsubscribe
      try {
        if (event) {
          channel.publish(event, message);
        } else {
          channel.publish(message);
        }
      } catch (error) {
        console.error(`failed to publish event on ${id}\n${error}`);
      }
    } else {
      console.error(`failed to publish event on ${id}`);
    }
  }

  function isSubscribed(topic: string, event?: SubEvents): boolean {
    const id = buildID(topic, event);
    return subscriptionMap.get(id) ? true : false;
  }
  

  return {
    subscribe,
    unsubscribe,
    publish,

    isSubscribed,
  };

}; 
export default usePubSub;
