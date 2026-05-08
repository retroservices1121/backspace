// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Author(s): See Git History
//
// Ably client. The API key now lives in NEXT_PUBLIC_ABLY_API_KEY rather
// than being baked into source — the previously committed value was a
// real production key and should be rotated in the Ably dashboard.
//
// For presence to work, Ably needs a clientId at construction time. We
// support two modes:
//   - module-level `ably` singleton: clientId-less, used by usePubSub for
//     plain channel pub/sub where presence is not needed.
//   - presenceClient(did): a separate connection scoped to a user's DID
//     so presence events carry a stable identifier. Memoized per DID.
//
// Long-term we should migrate the client off the raw API key entirely
// and onto Ably token auth (server issues short-lived tokens via
// /api/realtime/token); the key in env is the bridge step.

import { useSingleton } from '@src/hooks/useSingleton';
import Ably from 'ably';

const KEY = process.env.NEXT_PUBLIC_ABLY_API_KEY;

if (!KEY && typeof window !== 'undefined') {
  console.warn(
    'NEXT_PUBLIC_ABLY_API_KEY is not set — realtime features (presence, ' +
    'live messages) will not work in this build.',
  );
}

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

const ably = new Ably.Realtime.Promise(KEY ?? 'unset:unset');

useSingleton('ably_montoring', () => {
  ably.connection.on(function (stateChange) {
    console.debug('Ably connection state is ' + stateChange.current);
  });
});

export const ablyLite = () => {
  function publish(topic: string, message: any, event?: string) {
    const channel = ably.channels.get(topic);
    if (event) {
      channel.publish(event, message);
    } else {
      channel.publish(message);
    }
  }
  return { publish };
};

// Per-clientId connection cache. Presence requires a stable clientId,
// which can only be set at construction; reusing a connection across
// users would mix presence claims, so each DID gets its own client.
const presenceClients = new Map<string, Ably.Types.RealtimePromise>();

export function presenceClient(clientId: string): Ably.Types.RealtimePromise {
  let c = presenceClients.get(clientId);
  if (!c) {
    c = new Ably.Realtime.Promise({ key: KEY ?? 'unset:unset', clientId });
    presenceClients.set(clientId, c);
  }
  return c;
}

export function disposePresenceClient(clientId: string) {
  const c = presenceClients.get(clientId);
  if (c) {
    c.close();
    presenceClients.delete(clientId);
  }
}

export default ably;
