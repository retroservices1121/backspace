// POST /api/cron/import-polymarket
//
// Scheduled catalog import. Same body as /api/admin/import-polymarket
// but gated on a shared secret in the `Authorization: Bearer` header
// instead of a Privy session — Railway cron doesn't carry user
// identity, and we don't want to fake a service account just for
// this. Set CRON_SECRET in the Railway env (same value as the cron
// service uses).
//
// Default cadence is intentionally not encoded here. The Railway
// cron config calls this endpoint and decides how often (catalog
// every 15–60min, prices more often if/when we add a price-only
// route). The per-invocation `maxPages` cap keeps each tick bounded
// regardless of cadence.

import type { NextApiRequest, NextApiResponse } from 'next';

import { importPolymarketCatalog } from '@src/lib/markets/import';

// Defaults are tuned for the catalog cadence (every ~15min). 25 pages
// × 100 markets/page = 2500 markets per tick — Polymarket's full
// active catalog is comfortably below that, so a single tick will
// usually exhaust the keyset. If we ever need bigger sweeps the
// cron config can pass `maxPages` in the body.
const DEFAULT_MAX_PAGES = 25;
const DEFAULT_PAGE_SIZE = 100;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method not allowed');
    return;
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Refuse to run unauthenticated. If CRON_SECRET isn't configured
    // the route is effectively disabled — better than open.
    res.status(503).end('CRON_SECRET not configured');
    return;
  }

  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;
  if (token !== secret) {
    res.status(401).end('Unauthorized');
    return;
  }

  const body = (req.body ?? {}) as {
    maxPages?: number;
    pageSize?: number;
    startCursor?: string;
  };

  try {
    const summary = await importPolymarketCatalog({
      maxPages: typeof body.maxPages === 'number' ? body.maxPages : DEFAULT_MAX_PAGES,
      pageSize: typeof body.pageSize === 'number' ? body.pageSize : DEFAULT_PAGE_SIZE,
      startCursor: typeof body.startCursor === 'string' ? body.startCursor : undefined,
    });
    res.json(summary);
  } catch (err) {
    // Cron tooling needs a clear non-2xx so the schedule logs the
    // failure and we can find it later.
    // eslint-disable-next-line no-console
    console.error('cron import-polymarket failed', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
