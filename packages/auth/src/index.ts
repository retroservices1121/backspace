// Server-side end-user-token verification. Used by both apps/web and
// apps/admin. Exposes parallel Privy and CDP verifiers — `lib/nextconnect`
// dispatches based on the runtime config (Privy when PRIVY_APP_ID is
// set, CDP when CDP_API_KEY_ID is set). Both can be installed
// simultaneously so the migration can flip on a single env var without
// a rebuild.
//
// The `authId` stored on the User row was renamed in semantics on each
// auth-provider swap:
//   Firebase  → Firebase UID
//   Privy     → did:privy:...
//   CDP       → CDP end-user id (UUID format)
// All three are opaque to the rest of the codebase — they just key
// the User row lookup. The migration script in
// packages/db/scripts/repair-privy-did.cjs is the precedent.

import { CdpClient } from '@coinbase/cdp-sdk';
import { PrivyClient, AuthTokenClaims } from '@privy-io/server-auth';

// ─── Privy ─────────────────────────────────────────────────────────

export type PrivyConfig = {
  appId: string;
  appSecret: string;
};

const privyCache = new Map<string, PrivyClient>();

function privyClient(cfg: PrivyConfig): PrivyClient {
  const key = `${cfg.appId}::${cfg.appSecret}`;
  let c = privyCache.get(key);
  if (!c) {
    c = new PrivyClient(cfg.appId, cfg.appSecret);
    privyCache.set(key, c);
  }
  return c;
}

/** Verify a Privy access token. Throws on invalid / expired / wrong-app. */
export async function verifyPrivyToken(
  token: string,
  cfg: PrivyConfig,
): Promise<AuthTokenClaims> {
  return privyClient(cfg).verifyAuthToken(token);
}

/** Convenience: return the Privy `sub` (DID), which is what we persist in
 *  User.authId on Privy deployments. */
export async function getPrivyUserId(
  token: string,
  cfg: PrivyConfig,
): Promise<string> {
  const claims = await verifyPrivyToken(token, cfg);
  return claims.userId;
}

/** Resolve the user's primary email address from a Privy access token. */
export async function getPrivyUserEmail(
  idToken: string,
  cfg: PrivyConfig,
): Promise<string | null> {
  const user = await privyClient(cfg).getUser({ idToken });
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

/** Resolve the user's primary email by their verified Privy DID. */
export async function getPrivyUserEmailById(
  userId: string,
  cfg: PrivyConfig,
): Promise<string | null> {
  const user = await privyClient(cfg).getUser(userId);
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

/** List external (non-embedded) wallet addresses linked to a Privy user. */
export async function getPrivyExternalWalletsById(
  userId: string,
  cfg: PrivyConfig,
): Promise<string[]> {
  const user = await privyClient(cfg).getUser(userId);
  return (user.linkedAccounts ?? [])
    .filter((a): a is { type: 'wallet'; address: string; walletClientType?: string } =>
      a.type === 'wallet' && typeof (a as { address?: unknown }).address === 'string',
    )
    .filter((a) => a.walletClientType !== 'privy')
    .map((a) => a.address.toLowerCase());
}

// ─── CDP ───────────────────────────────────────────────────────────

export type CdpConfig = {
  apiKeyId: string;
  apiKeySecret: string;
  /** Optional. Required for some write endpoints; not needed for
   *  end-user access-token verification or read paths. */
  walletSecret?: string;
};

const cdpCache = new Map<string, CdpClient>();

function cdpClient(cfg: CdpConfig): CdpClient {
  const key = `${cfg.apiKeyId}::${cfg.apiKeySecret}::${cfg.walletSecret ?? ''}`;
  let c = cdpCache.get(key);
  if (!c) {
    c = new CdpClient({
      apiKeyId: cfg.apiKeyId,
      apiKeySecret: cfg.apiKeySecret,
      walletSecret: cfg.walletSecret,
    });
    cdpCache.set(key, c);
  }
  return c;
}

/** Verify a CDP end-user access token. Returns the EndUserAccount with
 *  `userId` + linked accounts. Throws on invalid / expired tokens. */
export async function verifyCdpToken(
  token: string,
  cfg: CdpConfig,
) {
  return cdpClient(cfg).endUser.validateAccessToken({ accessToken: token });
}

/** Convenience: return the CDP end-user id (what we persist in
 *  User.authId on CDP deployments). */
export async function getCdpUserId(
  token: string,
  cfg: CdpConfig,
): Promise<string> {
  const user = await verifyCdpToken(token, cfg);
  // EndUserAccount.userId is the stable per-project user identifier.
  return (user as { userId: string }).userId;
}

/** Resolve a user's primary email from an already-verified CDP user id.
 *  CDP's authenticationMethods array is the source of truth — walk it for
 *  the email entry. Returns null when the user signed in via SMS or wallet
 *  only. */
export async function getCdpUserEmailById(
  userId: string,
  cfg: CdpConfig,
): Promise<string | null> {
  const user = await cdpClient(cfg).endUser.getEndUser({ userId });
  type AuthMethod = { type?: string; email?: string };
  const methods = (user as { authenticationMethods?: AuthMethod[] }).authenticationMethods ?? [];
  const emailMethod = methods.find((m) => m?.type === 'email' && typeof m.email === 'string');
  return emailMethod?.email ?? null;
}

/** List external (SIWE-linked) EVM wallet addresses on a CDP end-user.
 *  CDP records SIWE links as authentication methods of type 'siwe' with
 *  the address attached. Embedded EVM accounts are filtered out — only
 *  user-attached external addresses are returned. */
export async function getCdpExternalWalletsById(
  userId: string,
  cfg: CdpConfig,
): Promise<string[]> {
  const user = await cdpClient(cfg).endUser.getEndUser({ userId });
  type AuthMethod = { type?: string; address?: string };
  const methods = (user as { authenticationMethods?: AuthMethod[] }).authenticationMethods ?? [];
  return methods
    .filter((m): m is { type: string; address: string } =>
      m?.type === 'siwe' && typeof m.address === 'string',
    )
    .map((m) => m.address.toLowerCase());
}

export type { AuthTokenClaims };
