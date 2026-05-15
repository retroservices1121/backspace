// Static constants + env reads for the Dflow integration. Lives
// alongside lib/polymarket/config.ts; each venue keeps its own.
//
// Client/server split:
//   - Solana RPC URL is NEXT_PUBLIC_ (the wallet broadcasts in the
//     browser).
//   - DFLOW_API_KEY is server-only — every Dflow endpoint requires
//     an x-api-key header (obtained from hello@dflow.net) and we
//     proxy through pages/api/dflow/* so the key never ships to the
//     client bundle.
//   - DFLOW_FEE_ACCOUNT is server-only too (the SPL token account
//     we receive platform fees into). The bps cut is exposed to the
//     client only for display purposes.

/** Dflow REST API base. All endpoints sit under this host. */
export const DFLOW_API_BASE = 'https://quote-api.dflow.net';

/** Solana mainnet mint addresses for the two tokens we'll quote
 *  against first. Phase 2's token catalog import will replace
 *  these hard-codes with a DB lookup, but Phase 1 needs at least
 *  one valid pair for the spike + early UI sanity. */
export const MINT = {
  /** Wrapped SOL (the "native" SOL mint used by SPL-aware DEXes). */
  SOL: 'So11111111111111111111111111111111111111112',
  /** USDC mainnet — circle.com canonical mint. */
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
} as const;

/** Solana RPC the embedded wallet broadcasts through. Returning
 *  undefined leaves Privy on the public mainnet-beta default. */
export function solanaRpcUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  return url && url.length > 0 ? url : undefined;
}

/** Dflow API key — server-only. Reading from the client returns
 *  undefined intentionally so misuse fails loudly. */
export function dflowApiKey(): string | undefined {
  if (typeof window !== 'undefined') return undefined;
  return process.env.DFLOW_API_KEY;
}

/** SPL token account that receives Backspace's platform fee cut.
 *  Server-only. Phase 4's swap proxy injects this into the /swap
 *  request body. */
export function dflowFeeAccount(): string | undefined {
  if (typeof window !== 'undefined') return undefined;
  return process.env.DFLOW_FEE_ACCOUNT;
}

/** Platform fee in basis points (e.g. 30 = 0.3%). Exposed to the
 *  client purely for display — the server enforces the actual fee
 *  on every /quote and /swap call. */
export function platformFeeBps(): number {
  const raw = process.env.NEXT_PUBLIC_DFLOW_PLATFORM_FEE_BPS;
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
