// Token market-data snapshot worker.
//
// Refreshes Token.priceUsd / priceChange24h / volumeUsd24h /
// liquidityUsd / statsAt from Jupiter's tokens/v2/search endpoint so
// the /tokens catalog can sort by trending / gainers / losers without
// hitting Jupiter on each render. Cadence is set by whichever cron
// service calls this worker — every 5-10 min is plenty given Jupiter's
// own data is aggregated over multi-minute windows.
//
// Jupiter's v2 search accepts a comma-separated list of mints in the
// `query` param and returns a parallel array of token objects. The
// `lite-api.jup.ag` host is the free public mirror — no API key, but
// we keep batch size + concurrency modest to be a polite consumer.
//
// Source response shape (only the fields we care about):
//   { id, usdPrice, liquidity, stats24h: { buyVolume, sellVolume,
//     priceChange } }
// priceChange is already a percentage (1.49 = +1.49%) — store as-is.

import { Prisma } from '@prisma/client';

import prisma from '@src/api2/prisma';

const JUPITER_SEARCH_URL = 'https://lite-api.jup.ag/tokens/v2/search';

// Jupiter accepts comma-separated mints in `query`. 50 keeps URLs
// well under any reasonable proxy length limit.
const BATCH_SIZE = 50;
// How many batches in flight at once. The lite host is free + public;
// stay polite.
const FETCH_CONCURRENCY = 4;
// Per-row Postgres update concurrency. Same shape as importDflowCatalog.
const UPDATE_CONCURRENCY = 10;

export type TokenStatsSummary = {
  tokensScanned: number;
  rowsUpdated: number;
  /** Returned no data by Jupiter (mint unknown / no pool / fresh listing). */
  rowsMissing: number;
  errors: Array<{ mint: string; message: string }>;
};

type JupiterStats24h = {
  buyVolume?: number;
  sellVolume?: number;
  priceChange?: number;
};
type JupiterToken = {
  id: string;
  usdPrice?: number;
  liquidity?: number;
  stats24h?: JupiterStats24h;
};

async function fetchBatch(mints: string[]): Promise<JupiterToken[]> {
  const url = `${JUPITER_SEARCH_URL}?query=${mints.join(',')}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Jupiter v2 search HTTP ${res.status} (${mints.length} mints)`);
  }
  const all = await res.json();
  return Array.isArray(all) ? (all as JupiterToken[]) : [];
}

export async function snapshotTokenStats(): Promise<TokenStatsSummary> {
  const summary: TokenStatsSummary = {
    tokensScanned: 0,
    rowsUpdated: 0,
    rowsMissing: 0,
    errors: [],
  };

  const tokens = await prisma.token.findMany({
    where: { isActive: true },
    select: { id: true, mint: true },
  });
  summary.tokensScanned = tokens.length;
  if (tokens.length === 0) return summary;

  // Chunk into mint batches for the Jupiter query.
  const batches: string[][] = [];
  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    batches.push(tokens.slice(i, i + BATCH_SIZE).map((t) => t.mint));
  }

  // Fan out the batches with bounded concurrency, collecting per-mint
  // results into a single lookup map.
  const statsByMint = new Map<string, JupiterToken>();
  for (let i = 0; i < batches.length; i += FETCH_CONCURRENCY) {
    const chunk = batches.slice(i, i + FETCH_CONCURRENCY);
    const results = await Promise.allSettled(chunk.map(fetchBatch));
    for (let j = 0; j < results.length; j += 1) {
      const r = results[j];
      if (r.status === 'fulfilled') {
        for (const tok of r.value) {
          if (tok && typeof tok.id === 'string') statsByMint.set(tok.id, tok);
        }
      } else {
        summary.errors.push({
          mint: chunk[j].join(','),
          message: (r.reason as Error).message,
        });
      }
    }
  }

  // Per-row UPDATE. Prisma has no updateMany-with-per-row-data so we
  // parallelize in modest chunks to bound the connection pool — same
  // pattern as importDflowCatalog's update loop.
  const now = new Date();
  for (let i = 0; i < tokens.length; i += UPDATE_CONCURRENCY) {
    const chunk = tokens.slice(i, i + UPDATE_CONCURRENCY);
    const ops = chunk.map(async (t) => {
      const stats = statsByMint.get(t.mint);
      // No row at all from Jupiter, or no price field — skip. Don't
      // wipe the previous snapshot to zero; a stale row is more useful
      // than nothing while the next tick re-runs.
      if (!stats || typeof stats.usdPrice !== 'number') {
        summary.rowsMissing += 1;
        return;
      }
      const volume = (stats.stats24h?.buyVolume ?? 0) + (stats.stats24h?.sellVolume ?? 0);
      const change = stats.stats24h?.priceChange;
      try {
        await prisma.token.update({
          where: { id: t.id },
          data: {
            priceUsd: new Prisma.Decimal(stats.usdPrice),
            volumeUsd24h: new Prisma.Decimal(volume),
            priceChange24h: typeof change === 'number'
              ? new Prisma.Decimal(change)
              : null,
            liquidityUsd: typeof stats.liquidity === 'number'
              ? new Prisma.Decimal(stats.liquidity)
              : null,
            statsAt: now,
          },
        });
        summary.rowsUpdated += 1;
      } catch (err) {
        summary.errors.push({
          mint: t.mint,
          message: (err as Error).message,
        });
      }
    });
    await Promise.all(ops);
  }
  return summary;
}
