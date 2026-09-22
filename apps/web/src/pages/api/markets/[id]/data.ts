import type { NextApiRequest, NextApiResponse } from 'next';

const DEFAULT_API_URL = 'https://api.dexbuilder.com';
const PREFIX = '/api/v4/prediction';

type Outcome = { token_id?: string; clob_token_id?: string; outcome?: unknown };
type Market = { condition_id?: string; outcomes?: Outcome[] };

async function gate(path: string) {
  const base = (process.env.GATE_DEXBUILDER_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');
  const response = await fetch(`${base}${PREFIX}${path}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Gate ${response.status}`);
  return response.json();
}

async function optional(path: string, fallback: unknown) {
  try { return await gate(path); } catch { return fallback; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const marketId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!marketId) return res.status(400).json({ message: 'market id required' });

  try {
    const market = await gate(`/markets/${encodeURIComponent(marketId)}`) as Market;
    const tokenIds = (market.outcomes || [])
      .map((outcome) => outcome.token_id || outcome.clob_token_id)
      .filter((token): token is string => Boolean(token));
    const now = Math.floor(Date.now() / 1000);
    const from = now - (30 * 24 * 60 * 60);

    const [trades, books, histories] = await Promise.all([
      optional(`/markets/${encodeURIComponent(marketId)}/trades?limit=40`, []),
      Promise.all(tokenIds.map(async (tokenId) => ({
        tokenId,
        book: await optional(`/tokens/${encodeURIComponent(tokenId)}/order_book?depth=20`, { bids: [], asks: [] }),
      }))),
      Promise.all(tokenIds.map(async (tokenId) => ({
        tokenId,
        history: await optional(`/tokens/${encodeURIComponent(tokenId)}/price_history?interval=1h&from=${from}&to=${now}`, { history: [] }),
      }))),
    ]);

    res.setHeader('Cache-Control', 'private, no-store');
    return res.json({ trades, books, histories, fetchedAt: Date.now() });
  } catch (error) {
    return res.status(502).json({
      message: error instanceof Error ? error.message : 'Gate market data unavailable',
    });
  }
}
