// POST /api/cron/recompute-accuracy
//
// Walks every user with at least one PolymarketPositionSnapshot row
// (i.e. anyone who has linked a Polymarket wallet AND has resolved
// positions) and recomputes their UserAccuracy. Should run after
// the snapshot worker so it picks up fresh data.

import type { NextApiRequest, NextApiResponse } from 'next';

import { recomputeAllUserAccuracy } from '@src/lib/markets/accuracy';

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
    const summary = await recomputeAllUserAccuracy();
    res.json(summary);
  } catch (err) {
    console.error('cron/recompute-accuracy failed', err);
    res.status(500).json({ error: (err as Error).message });
  }
}
