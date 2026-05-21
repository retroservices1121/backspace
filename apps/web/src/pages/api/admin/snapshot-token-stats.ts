// POST /api/admin/snapshot-token-stats
//
// Admin-only manual trigger for the token-stats refresh. Mirrors the
// cron route's behavior but auths via the user's Privy session +
// PlatformUserType.ADMIN check, so an operator can kick a one-off
// snapshot from a logged-in browser without rotating CRON_SECRET.

import { PlatformUserType } from '@prisma/client';

import prisma from '@src/api2/prisma';
import { snapshotTokenStats } from '@src/lib/dflow/snapshot-stats';
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
  try {
    const summary = await snapshotTokenStats();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default handler;
