// POST /api/admin/import-dflow
//
// Admin-only token catalog import. Pulls tradeable Solana mints
// from Dflow's /tokens-with-decimals, joins with Jupiter's strict
// list for metadata, and upserts into the Token table (see
// lib/dflow/import.ts).

import { PlatformUserType } from '@prisma/client';

import prisma from '@src/api2/prisma';
import { importDflowCatalog } from '@src/lib/dflow/import';
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
    const summary = await importDflowCatalog();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default handler;
