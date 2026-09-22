import type { NextApiRequest, NextApiResponse } from 'next';

// Backspace does not persist Gate orders or trades. Authenticated trading
// will proxy to Gate once its account credential flow is confirmed.
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({
    error: 'local_trade_storage_retired',
    message: 'Trading history is served by Gate and is not stored by Backspace.',
  });
}

