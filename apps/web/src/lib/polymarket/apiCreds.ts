// Polymarket L2 API credentials (key/secret/passphrase). Derived
// deterministically from the wallet's EIP-712 signature, so a cache
// miss only costs one extra signature prompt. Cached in sessionStorage
// — never localStorage — per Polymarket's own security guidance, since
// these are HMAC secrets.
import { ClobClient, type ApiKeyCreds } from '@polymarket/clob-client-v2';
import type { providers } from 'ethers';

import { CLOB_API_URL, POLYGON_CHAIN_ID } from './config';

const cacheKey = (address: string) =>
  `polymarket_api_creds_${address.toLowerCase()}`;

function loadCachedCreds(address: string): ApiKeyCreds | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(cacheKey(address));
    if (!raw) return null;
    const creds = JSON.parse(raw) as ApiKeyCreds;
    return creds.key && creds.secret && creds.passphrase ? creds : null;
  } catch {
    return null;
  }
}

function cacheCreds(address: string, creds: ApiKeyCreds): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(cacheKey(address), JSON.stringify(creds));
  } catch {
    // sessionStorage unavailable — fine, we just re-derive next time.
  }
}

// Returns the caller's API creds: cached, else derived (returning
// user), else freshly created (first-time user).
export async function ensureApiCreds(
  signer: providers.JsonRpcSigner,
  address: string,
): Promise<ApiKeyCreds> {
  const cached = loadCachedCreds(address);
  if (cached) return cached;

  // A signer-only client is enough to derive/create L2 creds.
  const tempClient = new ClobClient({
    host: CLOB_API_URL,
    chain: POLYGON_CHAIN_ID,
    signer,
  });
  const creds =
    (await tempClient.deriveApiKey().catch(() => null)) ??
    (await tempClient.createApiKey());
  cacheCreds(address, creds);
  return creds;
}
