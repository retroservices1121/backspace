// POST /api/admin/import-polymarket
//
// Admin-only catalog import. Pulls markets from Polymarket's Gamma
// keyset endpoint and upserts them into the Market and Outcome tables
// (see lib/markets/import.ts for the actual logic). Identity comes
// from the verified Privy token on req.authId; we additionally check
// User.platformPermission === ADMIN before running.
//
// Body (all optional):
//   maxPages    number   how many pages to walk this invocation
//   pageSize    number   markets per page (Polymarket caps at 1000)
//   startCursor string   resume mid-sweep — pass next call's truncated
//                        signal back here if you want to chunk
//
// Returns the ImportSummary so the caller can log volume / errors.

import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({
    error: 'provider_retired',
    message: 'Polymarket imports are disabled. Gate market data is served live.',
  });
}

