// Live Gate market detail data (trades, books, price history). Public data
// only; nothing is persisted. `?product=prediction|event_contracts` selects
// the Gate product (default prediction).

import type { NextApiRequest, NextApiResponse } from 'next';
import { gateCatalogAdapter, type GateCatalogAdapter } from '@backspace/markets';

import { parseGateProduct } from '@src/lib/gate/product';

const HISTORY_RANGE_MS = 14 * 24 * 60 * 60 * 1000; // documented 14-day max

async function optional<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try { return await load(); } catch { return fallback; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') return res.status(405).end();
  const marketId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!marketId) return res.status(400).json({ message: 'market id required' });

  const selection = parseGateProduct(req.query.product);
  const product = selection === 'all' ? 'prediction' : selection;
  const adapter: GateCatalogAdapter = gateCatalogAdapter(product, process.env.GATE_DEXBUILDER_API_URL);

  try {
    const market = await adapter.getRawMarket(marketId);
    if (!market) return res.status(404).json({ message: 'market not found' });
    const outcomes = (market.outcomes || []).flatMap((outcome) => {
      const tokenId = outcome.token_id || outcome.clob_token_id;
      return tokenId ? [{ tokenId, label: outcomeLabel(outcome.outcome) }] : [];
    });
    const labels = new Map(outcomes.map((outcome) => [outcome.tokenId, outcome.label]));
    const toMs = Date.now();
    const fromMs = toMs - HISTORY_RANGE_MS;

    const [tradePage, books, histories] = await Promise.all([
      optional(() => adapter.listTrades(marketId, { limit: 40 }), { trades: [], cursor: null }),
      Promise.all(outcomes.map(async ({ tokenId }) => ({
        tokenId,
        book: await optional(() => adapter.getOrderBook(tokenId, 20), { bids: [], asks: [] }),
      }))),
      Promise.all(outcomes.map(async ({ tokenId }) => ({
        tokenId,
        history: {
          history: await optional(() => adapter.getPriceHistory(tokenId, { interval: '1h', fromMs, toMs }), []),
        },
      }))),
    ]);

    // Keep the field names the market page already reads; created_at is ms.
    const trades = tradePage.trades.map((trade) => ({
      id: trade.tradeId,
      trade_id: trade.tradeId,
      token_id: trade.tokenId,
      outcome: (trade.tokenId && labels.get(trade.tokenId)) || '',
      side: trade.side,
      price: trade.price,
      size: trade.size,
      created_at: trade.timestamp,
    }));

    return res.json({ product, trades, books, histories, fetchedAt: Date.now() });
  } catch {
    return res.status(502).json({ message: 'Gate market data unavailable' });
  }
}

function outcomeLabel(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const preferred = record.en || record.en_US || record['en-US'] || record.default;
    if (typeof preferred === 'string') return preferred;
    const first = Object.values(record).find((item) => typeof item === 'string');
    if (typeof first === 'string') return first;
  }
  return '';
}
