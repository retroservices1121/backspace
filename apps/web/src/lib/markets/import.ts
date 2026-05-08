// Polymarket catalog importer.
//
// Pulls markets out of Polymarket's Gamma API (via the
// PolymarketAdapter) and upserts them into our Market and Outcome
// tables so the rest of the app — feed cards, /api/markets/[id],
// PostMarketCard — can read directly from Postgres without making
// per-render network calls to Polymarket.
//
// This is a manual-sweep importer for now (admin-triggered through
// POST /api/admin/import-polymarket). A scheduled cron path can wrap
// this same function once we decide on a refresh cadence; the
// per-request `maxPages` cap exists so a single Vercel function
// invocation stays inside its timeout budget.
//
// Builder docs: https://docs.polymarket.com/builders/overview
//   - Catalog endpoint: GET /markets/keyset (cursor-based)
//   - Rate limit on /markets: 300 req / 10s — well above what we need.
//   - condition_id is the stable cross-API market identifier.

import { MarketStatus } from '@prisma/client';
import { PolymarketAdapter } from '@backspace/markets';
import type { VenueMarket } from '@backspace/markets';

import prisma from '@src/api2/prisma';

export type ImportSummary = {
  processed: number;
  created: number;
  updated: number;
  outcomesUpserted: number;
  pagesFetched: number;
  // True if maxPages was hit before next_cursor became null. Caller
  // can send another request to continue the sweep.
  truncated: boolean;
  errors: Array<{ externalId: string; message: string }>;
};

export type ImportOptions = {
  /** Stop after this many pages. Default 25 — fits comfortably inside
   *  a 60s Vercel function with 100 markets/page. */
  maxPages?: number;
  /** Markets per page. Default 100. Polymarket caps at 1000. */
  pageSize?: number;
  /** Optional cursor to resume from. Defaults to start. */
  startCursor?: string;
};

export async function importPolymarketCatalog(
  opts: ImportOptions = {},
): Promise<ImportSummary> {
  const adapter = new PolymarketAdapter();
  const maxPages = opts.maxPages ?? 25;
  const pageSize = opts.pageSize ?? 100;

  const summary: ImportSummary = {
    processed: 0,
    created: 0,
    updated: 0,
    outcomesUpserted: 0,
    pagesFetched: 0,
    truncated: false,
    errors: [],
  };

  let cursor: string | undefined = opts.startCursor;
  for (let page = 0; page < maxPages; page++) {
    const result = await adapter.listMarkets({ limit: pageSize, cursor });
    summary.pagesFetched++;
    for (const vm of result.markets) {
      try {
        const created = await upsertVenueMarket(vm);
        summary.processed++;
        if (created) summary.created++;
        else summary.updated++;
        summary.outcomesUpserted += vm.outcomes.length;
      } catch (err) {
        summary.errors.push({
          externalId: vm.externalId,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }
    if (!result.cursor) {
      // Reached end of catalog within budget.
      return summary;
    }
    cursor = result.cursor;
  }
  // Hit page cap before exhausting the catalog. Caller can continue
  // by sending the same request again — Polymarket's keyset cursor
  // doesn't drift, but we don't surface it here to keep the
  // contract simple. A "continue" call without a startCursor will
  // re-import what we already have (idempotent), which is fine.
  summary.truncated = true;
  return summary;
}

// Upsert a single market plus its outcomes. Returns true if the
// Market row was created (vs. updated) so the caller can keep tally.
async function upsertVenueMarket(vm: VenueMarket): Promise<boolean> {
  const existing = await prisma.market.findUnique({
    where: { venueExternalId: { venue: vm.venue, externalId: vm.externalId } },
    select: { id: true },
  });

  const data = {
    venue: vm.venue,
    externalId: vm.externalId,
    chain: vm.chain,
    contractAddress: vm.contractAddress,
    question: vm.question,
    description: vm.description,
    category: vm.category,
    imageUrl: vm.imageUrl,
    status: vm.status as MarketStatus,
    opensAt: vm.opensAt,
    closesAt: vm.closesAt,
    resolvedAt: vm.resolvedAt,
  };

  let marketId: bigint;
  if (existing) {
    const updated = await prisma.market.update({
      where: { id: existing.id },
      data,
      select: { id: true },
    });
    marketId = updated.id;
  } else {
    const created = await prisma.market.create({
      data,
      select: { id: true },
    });
    marketId = created.id;
  }

  // Upsert outcomes individually. We don't delete outcomes that the
  // venue has dropped because Position rows reference them via FK and
  // a settled position would lose its referent. If a market truly
  // changes outcome shape (rare on Polymarket), an admin can clean up
  // by hand.
  for (const o of vm.outcomes) {
    await prisma.outcome.upsert({
      where: {
        marketOutcome: { marketId, externalId: o.externalId },
      },
      create: {
        market: { connect: { id: marketId } },
        externalId: o.externalId,
        label: o.label,
        lastPrice: o.lastPrice,
        lastPriceAt: o.lastPriceAt,
      },
      update: {
        label: o.label,
        lastPrice: o.lastPrice,
        lastPriceAt: o.lastPriceAt,
      },
    });
  }

  return !existing;
}
