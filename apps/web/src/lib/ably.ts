// Shared Ably topic helpers and constants — safe to import from
// both server and browser. Connection-creating code lives in
// `lib/ablyClient.ts` (browser, token-auth) and `lib/ablyServer.ts`
// (server, master-key Rest). This file MUST stay client constructor
// free so importing it server-side never spins up a browser client.

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

// Community-channel chat topic. The channel's UUID (stable across the
// client/server boundary; the numeric id has had inconsistent treatment
// in older message routes) keys the topic so subscribers and publishers
// agree without sharing the BigInt id.
export const buildChannelTopic = (channelUuid: string) => {
  return `${RealtimeCategories.CHANNEL}[${channelUuid}]`;
};
