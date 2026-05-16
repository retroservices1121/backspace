// Dflow token catalog importer.
//
// Pulls the set of tradeable Solana mints from Dflow's
// /tokens-with-decimals endpoint (mint + decimals only — no name,
// symbol, or logo) and joins them against Jupiter's V2 verified
// token list (lite-api.jup.ag/tokens/v2/tag?tag=verified) for
// display metadata.
// Mints not in the verified list are intentionally skipped — that
// list is curated and keeps the obvious spam/scam tokens out.
// Upserts into the Token table so the rest of the app — token
// picker, PostTokenCard — can read directly from Postgres.
//
// Two trigger paths mirror the Polymarket import:
//   - Manual: POST /api/admin/import-dflow (admin-gated, ad-hoc).
//   - Scheduled: POST /api/cron/import-dflow (Railway cron, gated
//     on CRON_SECRET in the Authorization header).
//
// API key handling: Dflow requires x-api-key on every endpoint. The
// importer reads DFLOW_API_KEY from process.env (server-only) via
// dflowApiKey(). Returns a 503-style error result if unset so the
// caller can surface a clear "not configured" message.

import prisma from '@src/api2/prisma';

import { DFLOW_API_BASE, dflowApiKey } from './config';

// Jupiter's public token list. The original `token.jup.ag/strict`
// host was decommissioned mid-2024 and Jupiter migrated to the V2
// Tokens API at `<host>/tokens/v2/tag`. The paid host
// (`api.jup.ag`) needs `x-api-key`; `lite-api.jup.ag` is the free
// public mirror with the same paths.
//
// Param naming gotcha: the tag endpoint accepts the value (e.g.
// `verified`) under the param name `query`, not `tag`. Jupiter's
// own docs summary is inconsistent — the OpenAPI spec is the
// source of truth.
//
// V2 response fields differ from V1 (`id` instead of `address`,
// `icon` instead of `logoURI`) — the parser below tolerates both.
//
// Overridable via JUPITER_TOKEN_LIST_URL so a future Jupiter URL
// change can be fixed by setting an env var on Railway without a
// redeploy.
const DEFAULT_JUPITER_LIST = 'https://lite-api.jup.ag/tokens/v2/tag?query=verified';
function jupiterListUrl(): string {
  return process.env.JUPITER_TOKEN_LIST_URL || DEFAULT_JUPITER_LIST;
}

export type ImportSummary = {
  fromDflow: number;
  withJupiterMeta: number;
  created: number;
  updated: number;
  skippedNoMeta: number;
  errors: Array<{ mint: string; message: string }>;
};

type JupiterToken = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
};

// V2 entries name the mint `id` and the logo `icon`; V1 used
// `address` and `logoURI`. Normalize so the rest of the importer
// doesn't care which shape Jupiter is serving today.
type JupiterRawToken = Partial<JupiterToken> & {
  id?: string;
  icon?: string;
  logo?: string;
};
function normalizeJupiterToken(t: JupiterRawToken): JupiterToken | null {
  const address = t.address ?? t.id;
  if (!address || typeof t.symbol !== 'string' || typeof t.name !== 'string') {
    return null;
  }
  return {
    address,
    symbol: t.symbol,
    name: t.name,
    decimals: typeof t.decimals === 'number' ? t.decimals : 0,
    logoURI: t.logoURI ?? t.icon ?? t.logo,
  };
}

/** Node's built-in fetch wraps the network failure in a generic
 *  `TypeError: fetch failed` with the real reason on .cause. Surface
 *  the cause + the URL we were trying to hit so a Railway egress
 *  block / DNS failure / wrong env value doesn't look like a generic
 *  outage. */
function describeFetchError(url: string, err: unknown): Error {
  const e = err as { message?: string; cause?: { code?: string; message?: string } };
  const cause = e.cause;
  const detail = cause
    ? `${cause.code ?? 'err'}: ${cause.message ?? 'unknown'}`
    : (e.message ?? 'unknown');
  return new Error(`fetch ${url} failed (${detail})`);
}

/** Pull the active mint+decimals list from Dflow. */
async function fetchDflowTokens(apiKey: string): Promise<Array<[string, number]>> {
  const url = `${DFLOW_API_BASE}/tokens-with-decimals`;
  let res: Response;
  try {
    res = await fetch(url, { headers: { 'x-api-key': apiKey } });
  } catch (err) {
    throw describeFetchError(url, err);
  }
  if (!res.ok) {
    throw new Error(`Dflow /tokens-with-decimals HTTP ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error('Dflow /tokens-with-decimals: expected array');
  }
  return data as Array<[string, number]>;
}

/** Pull Jupiter's curated verified token list for metadata enrichment. */
async function fetchJupiterStrict(): Promise<Map<string, JupiterToken>> {
  const url = jupiterListUrl();
  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    throw describeFetchError(url, err);
  }
  if (!res.ok) {
    throw new Error(`Jupiter token list HTTP ${res.status}: ${await res.text()}`);
  }
  const list = (await res.json()) as JupiterRawToken[];
  if (!Array.isArray(list)) {
    throw new Error('Jupiter token list: expected array');
  }
  const byMint = new Map<string, JupiterToken>();
  for (const raw of list) {
    const t = normalizeJupiterToken(raw);
    if (t) byMint.set(t.address, t);
  }
  return byMint;
}

export async function importDflowCatalog(): Promise<ImportSummary> {
  const apiKey = dflowApiKey();
  const summary: ImportSummary = {
    fromDflow: 0,
    withJupiterMeta: 0,
    created: 0,
    updated: 0,
    skippedNoMeta: 0,
    errors: [],
  };
  if (!apiKey) {
    throw new Error('DFLOW_API_KEY is not configured');
  }

  const [dflowTokens, jupiterByMint] = await Promise.all([
    fetchDflowTokens(apiKey),
    fetchJupiterStrict(),
  ]);
  summary.fromDflow = dflowTokens.length;

  for (const [mint, decimalsFromDflow] of dflowTokens) {
    const meta = jupiterByMint.get(mint);
    if (!meta) {
      summary.skippedNoMeta += 1;
      continue;
    }
    summary.withJupiterMeta += 1;

    // Trust Dflow's decimals for routing accuracy (it knows the
    // tradeable pool) but fall back to Jupiter's if Dflow ever
    // sends 0/null. They should always match for real tokens.
    const decimals =
      Number.isFinite(decimalsFromDflow) && decimalsFromDflow >= 0
        ? decimalsFromDflow
        : meta.decimals;

    try {
      const existing = await prisma.token.findUnique({
        where: { mint },
        select: { id: true },
      });
      await prisma.token.upsert({
        where: { mint },
        create: {
          mint,
          symbol: meta.symbol,
          name: meta.name,
          decimals,
          logoURI: meta.logoURI ?? null,
        },
        update: {
          symbol: meta.symbol,
          name: meta.name,
          decimals,
          logoURI: meta.logoURI ?? null,
        },
      });
      if (existing) summary.updated += 1;
      else summary.created += 1;
    } catch (err) {
      summary.errors.push({ mint, message: (err as Error).message });
    }
  }

  return summary;
}
