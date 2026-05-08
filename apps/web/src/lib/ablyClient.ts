// Browser-side Ably client. Token auth via /api/realtime/token —
// the master key never reaches the client, and `clientId` is set
// server-side from the Privy session, not by the browser.
//
// Single client per page: presence used to need a per-clientId
// connection because the SDK only accepts clientId at construction,
// but with token auth the *server* picks the clientId, so the same
// client can carry presence claims for whoever's signed in.

import Ably from 'ably';

let cached: Ably.Types.RealtimePromise | null = null;

export function ablyClient(): Ably.Types.RealtimePromise {
  if (cached) return cached;
  cached = new Ably.Realtime.Promise({
    authUrl: '/api/realtime/token',
    authMethod: 'POST',
    authHeaders: { 'Content-Type': 'application/json' },
  });
  return cached;
}

export function disposeAblyClient() {
  if (cached) {
    cached.close();
    cached = null;
  }
}
