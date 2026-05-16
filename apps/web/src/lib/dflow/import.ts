// Dflow token catalog importer.
//
// Pulls the set of tradeable Solana mints from Dflow's
// /tokens-with-decimals endpoint (mint + decimals only — no name,
// symbol, or logo) and joins them against Jupiter's strict token
// list (token.jup.ag/strict) for display metadata. Mints not in
// Jupiter's strict list are intentionally skipped — that list is
// curated and keeps the obvious spam/scam tokens out of the catalog.
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

const JUPITER_STRICT_LIST = 'https://token.jup.ag/strict';

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

/** Pull Jupiter's curated strict token list for metadata enrichment. */
async function fetchJupiterStrict(): Promise<Map<string, JupiterToken>> {
  let res: Response;
  try {
    res = await fetch(JUPITER_STRICT_LIST);
  } catch (err) {
    throw describeFetchError(JUPITER_STRICT_LIST, err);
  }
  if (!res.ok) {
    throw new Error(`Jupiter strict list HTTP ${res.status}: ${await res.text()}`);
  }
  const list = (await res.json()) as JupiterToken[];
  const byMint = new Map<string, JupiterToken>();
  for (const t of list) {
    if (typeof t.address === 'string') byMint.set(t.address, t);
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
