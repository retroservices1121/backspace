// Central config for the Polymarket trade integration. Intentionally
// SDK-free so it's cheap to import from both server routes and client
// modules — the heavy @polymarket/* SDKs are lazy-loaded inside the
// other lib/polymarket/* files. Contract addresses are NOT hardcoded
// here: clob-client-v2 and builder-relayer-client each ship a
// getContractConfig(chainId) that is the source of truth for V2
// addresses (pUSD collateral, V2 exchanges, Safe factory, …).

export const POLYGON_CHAIN_ID = 137;

// Polymarket service endpoints (V2 / CLOB V2 era).
export const CLOB_API_URL = 'https://clob.polymarket.com';
export const RELAYER_URL = 'https://relayer-v2.polymarket.com';
export const DATA_API_URL = 'https://data-api.polymarket.com';
export const GAMMA_API_URL = 'https://gamma-api.polymarket.com';

// Public — safe to expose to the browser. The builder code is order
// attribution metadata, not a secret.
export function builderCode(): string | undefined {
  return process.env.NEXT_PUBLIC_POLYMARKET_BUILDER_CODE || undefined;
}

// Public — the Polygon RPC the embedded wallet + read clients use.
export function polygonRpcUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_POLYGON_RPC_URL || undefined;
}

export type BuilderHmacCreds = {
  key: string;
  secret: string;
  passphrase: string;
};

// SERVER-ONLY. The HMAC builder credentials authenticate Backspace to
// Polymarket's gasless Relayer (Safe deploy + token approvals). Never
// import this into client code — it reads non-public env vars. Returns
// null if any piece is missing so callers can fail cleanly.
export function builderHmacCreds(): BuilderHmacCreds | null {
  const key = process.env.POLYMARKET_BUILDER_API_KEY;
  const secret = process.env.POLYMARKET_BUILDER_SECRET;
  const passphrase = process.env.POLYMARKET_BUILDER_PASSPHRASE;
  if (!key || !secret || !passphrase) return null;
  return { key, secret, passphrase };
}
