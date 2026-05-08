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

import { PlatformUserType } from '@prisma/client';

import prisma from '@src/api2/prisma';
import { importPolymarketCatalog } from '@src/lib/markets/import';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

const handler = createHandler();

handler.use(requireAuthMiddleware).post(async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { authId: req.authId },
    select: { platformPermission: true },
  });
  if (!me || me.platformPermission !== PlatformUserType.ADMIN) {
    res.status(403).end('Admin only');
    return;
  }

  const body = (req.body ?? {}) as {
    maxPages?: number;
    pageSize?: number;
    startCursor?: string;
  };

  // BigInt id columns elsewhere — keep the response JSON-safe even if
  // we ever start including them in the summary.
  const summary = await importPolymarketCatalog({
    maxPages: typeof body.maxPages === 'number' ? body.maxPages : undefined,
    pageSize: typeof body.pageSize === 'number' ? body.pageSize : undefined,
    startCursor: typeof body.startCursor === 'string' ? body.startCursor : undefined,
  });
  res.json(summary);
});

export default handler;
