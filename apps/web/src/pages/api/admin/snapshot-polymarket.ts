// POST /api/admin/snapshot-polymarket
//
// Admin-only manual trigger for the position snapshot worker. Mirrors
// the cron route's behavior but auths via the user's Privy session
// + PlatformUserType.ADMIN check, so we can run a one-off snapshot
// from a logged-in browser without rotating the cron secret.

import { PlatformUserType } from '@prisma/client';

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { snapshotPolymarketPositions } from '@src/lib/markets/snapshot-polymarket';

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
  try {
    const summary = await snapshotPolymarketPositions();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default handler;
