// POST /api/cron/import-dflow
//
// Scheduled token-catalog import. Same body as
// /api/admin/import-dflow but gated on CRON_SECRET in the
// Authorization header instead of a Privy session — Railway cron
// doesn't carry user identity.
//
// Cadence is decided by the Railway cron config calling this endpoint
// (a few times a day is plenty; the Dflow tradeable-mint set doesn't
// churn the way Polymarket markets do).

import type { NextApiRequest, NextApiResponse } from 'next';

import { importDflowCatalog } from '@src/lib/dflow/import';

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
    res.status(503).end('CRON_SECRET not configured');
    return;
  }
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;
  if (token !== secret) {
    res.status(401).end('Unauthorized');
    return;
  }

  try {
    const summary = await importDflowCatalog();
    res.json(summary);
  } catch (err) {
    console.error('cron/import-dflow failed', err);
    res.status(500).json({ error: (err as Error).message });
  }
}
