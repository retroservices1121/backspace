// POST /api/admin/recompute-accuracy
//
// Admin-only manual trigger for the accuracy aggregator. Mirrors
// the cron route's behavior but auths via the user's Privy session
// + PlatformUserType.ADMIN check, so we can run a one-off recompute
// from a logged-in browser without rotating the cron secret.
//
// Usually paired with /api/admin/snapshot-polymarket — snapshot
// pulls the latest resolved positions from Polymarket's Data API
// for every linked wallet, this aggregates those into the per-user
// UserAccuracy row that drives the profile badge + leaderboard.

import { PlatformUserType } from '@prisma/client';

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { recomputeAllUserAccuracy } from '@src/lib/markets/accuracy';

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
    const summary = await recomputeAllUserAccuracy();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default handler;
