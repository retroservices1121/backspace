// POST /api/cron/snapshot-token-stats
//
// Scheduled refresh of Token market-data (price, 24h volume, 24h
// change, liquidity) from Jupiter's tokens/v2/search. Should run more
// frequently than the catalog import — Jupiter's stats update every
// few minutes, the tradeable-mint set changes once a day at most.
//
// Gated on CRON_SECRET in the Authorization header, same convention
// as the other cron routes.

import type { NextApiRequest, NextApiResponse } from 'next';

import { snapshotTokenStats } from '@src/lib/dflow/snapshot-stats';

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
    const summary = await snapshotTokenStats();
    res.json(summary);
  } catch (err) {
    console.error('cron/snapshot-token-stats failed', err);
    res.status(500).json({ error: (err as Error).message });
  }
}
