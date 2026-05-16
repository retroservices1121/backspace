// POST /api/cron/snapshot-polymarket
//
// Scheduled worker that walks every linked-Polymarket-wallet and
// persists resolved positions into PolymarketPositionSnapshot. Phase
// 10.4's accuracy aggregator reads that table.
//
// Gated on CRON_SECRET in the Authorization header (same convention
// as the Polymarket + Dflow imports). The GitHub Action that schedules
// this carries the bearer.

import type { NextApiRequest, NextApiResponse } from 'next';

import { snapshotPolymarketPositions } from '@src/lib/markets/snapshot-polymarket';

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
    const summary = await snapshotPolymarketPositions();
    res.json(summary);
  } catch (err) {
    console.error('cron/snapshot-polymarket failed', err);
    res.status(500).json({ error: (err as Error).message });
  }
}
