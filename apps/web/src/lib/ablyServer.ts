// Server-side Ably bits: a Rest client signed with the master API
// key for publishing from API routes, plus the token-request signer
// the browser auth flow calls.
//
// Import from API routes only — pulling this in from the browser
// would expose the master key. The split between this file and
// `lib/ably.ts` (helpers) / `lib/ablyClient.ts` (browser client) is
// what enforces that.

import Ably from 'ably';

const KEY = process.env.ABLY_API_KEY;

let cachedRest: Ably.Rest | null = null;

function rest(): Ably.Rest {
  if (cachedRest) return cachedRest;
  if (!KEY) {
    throw new Error('ABLY_API_KEY is not configured');
  }
  cachedRest = new Ably.Rest({ key: KEY });
  return cachedRest;
}

export function ablyLite() {
  function publish(topic: string, message: any, event?: string) {
    const channel = rest().channels.get(topic);
    if (event) {
      // The Rest publish returns a Promise; callers don't currently
      // await it (publish-and-forget is the usual pattern for
      // post-write fanout) but if they ever do it'll work.
      void channel.publish(event, message);
    } else {
      void channel.publish('message', message);
    }
  }
  return { publish };
}

// Server-issued TokenRequest. Bakes the authenticated user's DID in
// as `clientId` so the client can't spoof identity. Default cap is
// "subscribe + publish + presence" on every channel — narrow this if
// we ever introduce admin-only channels. TTL defaults to Ably's own
// 60 minutes; the browser auto-refreshes via authUrl.
export async function createTokenRequest(clientId: string) {
  return rest().auth.createTokenRequest({
    clientId,
    capability: { '*': ['subscribe', 'publish', 'presence'] },
  });
}
