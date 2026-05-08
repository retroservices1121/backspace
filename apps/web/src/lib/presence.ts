// Online presence backed by Ably. Replaces the legacy Firebase Realtime
// Database `setConnected` / `subscribeToStatusChanges` flow.
//
// Model:
//   - One global presence channel: `presence:global`. The client's
//     Ably token (issued by /api/realtime/token) carries the user's
//     Privy DID as clientId, so presence claims are server-authoritative
//     — the browser cannot pick its own clientId.
//   - Online status (Online / Idle / Away) is published as the presence
//     `data` payload. `idle-js` drives the transitions on the
//     window the user has focus on; presence updates re-publish to the
//     channel.
//   - Subscribers receive the full member list on first subscribe and
//     deltas after; we project that into the existing redux
//     `users.onlineStatus` map keyed by clientId (DID).

import { Types } from 'ably';

import { ablyClient, disposeAblyClient } from '@src/lib/ablyClient';
import { OnlinePresence } from '@src/types/documents';

const PRESENCE_CHANNEL = 'presence:global';

type Idle = {
  start(): void;
  stop?(): void;
};

let idleHandle: Idle | null = null;
let entered = false;

/**
 * Announce the current user as online and start the idle/active/away
 * transition tracker. Safe to call multiple times — subsequent calls
 * are no-ops if presence is already active on this client.
 *
 * The `did` argument is kept for source compatibility with the
 * pre-token-auth callsite, but the actual clientId comes from the
 * server-signed Ably token, not from this argument.
 */
export async function announcePresence(_did: string): Promise<() => void> {
  if (entered) return () => disconnectPresence();

  const client = ablyClient();
  const channel = client.channels.get(PRESENCE_CHANNEL);

  await channel.presence.enter({ status: OnlinePresence.Online });
  entered = true;

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
    // eslint-disable-next-line no-console
    console.warn('idle-js unavailable, skipping idle transitions', err);
  }

  return () => disconnectPresence();
}

export function disconnectPresence() {
  if (!entered) return;
  if (idleHandle && typeof idleHandle.stop === 'function') {
    try { idleHandle.stop(); } catch {}
  }
  idleHandle = null;
  // Closing the connection releases presence claim on the server side;
  // no need to call leave() explicitly. We dispose the cached client
  // so the next sign-in mints a fresh token under the new identity.
  disposeAblyClient();
  entered = false;
}

export type PresenceMap = Map<string, OnlinePresence>;

/**
 * Subscribe to the global presence channel and project every membership
 * change into a callback that receives the full {clientId → status}
 * map. Returns an unsubscribe function.
 */
export async function subscribePresence(
  _did: string,
  onUpdate: (members: PresenceMap) => void,
): Promise<() => void> {
  const client = ablyClient();
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
