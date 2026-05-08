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

export type { AuthTokenClaims };
