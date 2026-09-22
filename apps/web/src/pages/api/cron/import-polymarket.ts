import type { NextApiRequest, NextApiResponse } from 'next';

/** Retained temporarily so a stale Railway schedule fails explicitly. */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({
    error: 'provider_retired',
    message: 'Polymarket imports are disabled. Gate market data is served live.',
  });
}

