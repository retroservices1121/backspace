// Server-side Privy token verification, used by both apps/web and apps/admin.
// Each app passes its OWN appId/appSecret — admin's Privy app is distinct from
// the user-facing one. Cross-app tokens cannot authenticate.
//
// Privy issues access tokens that look like JWTs; @privy-io/server-auth verifies
// the signature and returns the claims. The `sub` claim is the stable user
// identifier (a `did:privy:...` string) — that's what we store in
// User.authId, replacing the Firebase UID.

import { PrivyClient, AuthTokenClaims } from '@privy-io/server-auth';

export type PrivyConfig = {
  appId: string;
  appSecret: string;
};

const cache = new Map<string, PrivyClient>();

function client(cfg: PrivyConfig): PrivyClient {
  const key = `${cfg.appId}::${cfg.appSecret}`;
  let c = cache.get(key);
  if (!c) {
    c = new PrivyClient(cfg.appId, cfg.appSecret);
    cache.set(key, c);
  }
  return c;
}

/**
 * Verify a Privy access token. Throws if the token is invalid, expired, or
 * issued by a different app than `cfg.appId`.
 */
export async function verifyPrivyToken(
  token: string,
  cfg: PrivyConfig,
): Promise<AuthTokenClaims> {
  return client(cfg).verifyAuthToken(token);
}

/**
 * Convenience: verify and return the Privy `sub` (DID), which is what we
 * persist in User.authId.
 */
export async function getPrivyUserId(
  token: string,
  cfg: PrivyConfig,
): Promise<string> {
  const claims = await verifyPrivyToken(token, cfg);
  return claims.userId; // alias for `sub` in privy SDK
}

/**
 * Resolve the user's primary email address from a Privy access token.
 *
 * The JWT claims do not include the email, so this calls
 * `client.getUser({idToken})` (the rate-limit-friendly variant) and walks
 * the linked accounts in priority order:
 *
 *   1. The dedicated `email` link (set when the user signs in via OTP).
 *   2. Any OAuth provider that exposes an email — Google, Apple, GitHub,
 *      LinkedIn, Discord. We trust whichever one we find first; matching
 *      `Private.email` is case-insensitive at the call site.
 *
 * Returns null if no email is reachable (e.g. wallet-only login).
 *
 * Used by the claim-your-account flow to match a fresh Privy session
 * against an existing legacy User row whose `Private.email` was set when
 * the legacy Firestore→Postgres migration ran.
 */
export async function getPrivyUserEmail(
  idToken: string,
  cfg: PrivyConfig,
): Promise<string | null> {
  const user = await client(cfg).getUser({ idToken });
  return (
    user.email?.address ??
    user.google?.email ??
    user.apple?.email ??
    user.github?.email ??
    user.linkedin?.email ??
    user.discord?.email ??
    null
  );
}

/**
 * Resolve the user's primary email address from their verified Privy
 * DID (`did:privy:...`).
 *
 * Use this when you already have a verified DID — e.g. from
 * `verifyPrivyToken` on the request's *access* token. The access token
 * is NOT an identity token, so it cannot be passed to
 * `getPrivyUserEmail`'s `getUser({ idToken })` path; doing so throws.
 * This fetches the user record from Privy's API by id instead, walking
 * the same linked-account priority order.
 */
export async function getPrivyUserEmailById(
  userId: string,
  cfg: PrivyConfig,
): Promise<string | null> {
  const user = await client(cfg).getUser(userId);
  return (
    user.email?.address ??
    user.google?.email ??
    user.apple?.email ??
    user.github?.email ??
    user.linkedin?.email ??
    user.discord?.email ??
    null
  );
}

export type { AuthTokenClaims };
