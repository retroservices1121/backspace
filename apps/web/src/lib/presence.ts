// Online presence backed by Ably. Replaces the legacy Firebase Realtime
// Database `setConnected` / `subscribeToStatusChanges` flow.
//
// Model:
//   - One global presence channel: `presence:global`. Every signed-in
//     client `enter`s it with their Privy DID as Ably clientId. Ably
//     auto-removes them on disconnect via the WebSocket close handshake,
//     so `lastOnline` bookkeeping is no longer something we maintain.
//   - Online status (Online / Idle / Away) is published as the presence
//     `data` payload. `idle-js` still drives the transitions on the
//     window the user has focus on; presence updates re-publish to the
//     channel.
//   - Subscribers receive the full member list on first subscribe and
//     deltas after; we project that into the existing redux
//     `users.onlineStatus` map keyed by DID.

import { Types } from 'ably';

import { presenceClient, disposePresenceClient } from '@src/lib/ably';
import { OnlinePresence } from '@src/types/documents';

const PRESENCE_CHANNEL = 'presence:global';

type Idle = {
  start(): void;
  stop?(): void;
};

let idleHandle: Idle | null = null;
let activeDid: string | null = null;

/**
 * Announce the current user as online and start the idle/active/away
 * transition tracker. Safe to call multiple times — subsequent calls
 * are no-ops if the same DID is already announced.
 *
 * Returns a teardown function. The caller (useAuthenticate) doesn't
 * have to invoke it on logout because Ably reaps the presence on
 * disconnect, but explicit cleanup is available for completeness.
 */
export async function announcePresence(did: string): Promise<() => void> {
  if (activeDid === did) return () => disconnectPresence();
  if (activeDid && activeDid !== did) {
    // Different user logged in on this client — tear down the prior
    // presence claim before announcing the new one.
    disconnectPresence();
  }
  activeDid = did;

  const client = presenceClient(did);
  const channel = client.channels.get(PRESENCE_CHANNEL);

  await channel.presence.enter({ status: OnlinePresence.Online });

  // idle-js drives Online ⇄ Idle ⇄ Away from window/document events.
  try {
    // Lazy require so SSR doesn't try to bind to window.
    const IdleJs = require('idle-js');
    idleHandle = new IdleJs({
      idle: 60 * 1000,
      events: ['mousemove', 'keydown', 'mousedown', 'touchstart'],
      onIdle: () => channel.presence.update({ status: OnlinePresence.Idle }),
      onActive: () => channel.presence.update({ status: OnlinePresence.Online }),
      onHide: () => channel.presence.update({ status: OnlinePresence.Away }),
      onShow: () => channel.presence.update({ status: OnlinePresence.Online }),
      keepTracking: true,
      startAtIdle: false,
    });
    idleHandle?.start();
  } catch (err) {
    // idle-js is missing or the environment doesn't support it (SSR).
    // Presence still works; we just don't get the idle transitions.
    console.warn('idle-js unavailable, skipping idle transitions', err);
  }

  return () => disconnectPresence();
}

export function disconnectPresence() {
  if (!activeDid) return;
  if (idleHandle && typeof idleHandle.stop === 'function') {
    try { idleHandle.stop(); } catch {}
  }
  idleHandle = null;
  // closing the connection releases presence claim on the server side;
  // no need to call leave() explicitly.
  disposePresenceClient(activeDid);
  activeDid = null;
}

export type PresenceMap = Map<string, OnlinePresence>;

/**
 * Subscribe to the global presence channel and project every membership
 * change into a callback that receives the full {clientId → status}
 * map. Returns an unsubscribe function.
 *
 * Requires a Privy DID for the listener so it can reuse / build the
 * per-DID connection — pass the same DID currently announced via
 * `announcePresence`.
 */
export async function subscribePresence(
  did: string,
  onUpdate: (members: PresenceMap) => void,
): Promise<() => void> {
  const client = presenceClient(did);
  const channel = client.channels.get(PRESENCE_CHANNEL);

  const project = async () => {
    const members = await channel.presence.get();
    const map: PresenceMap = new Map();
    for (const m of members) {
      const status = (m.data as { status?: OnlinePresence } | undefined)?.status;
      if (m.clientId) {
        map.set(m.clientId, status ?? OnlinePresence.Online);
      }
    }
    onUpdate(map);
  };

  const handler = (_msg: Types.PresenceMessage) => { void project(); };
  await channel.presence.subscribe(handler);
  await project();

  return () => {
    channel.presence.unsubscribe(handler);
  };
}
