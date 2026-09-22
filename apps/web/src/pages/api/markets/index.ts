// Live Gate DexBuilder catalog gateway. No market data is persisted.

import { GatePredictionAdapter } from '@backspace/markets';

import createHandler from '@src/lib/nextconnect';

type SortKey = 'closing' | 'trending' | 'volume' | 'volume_asc';

const handler = createHandler();

handler.get(async (req, res) => {
  const requested = Number.parseInt((req.query.limit as string) ?? '', 10);
  const limit = Number.isFinite(requested) && requested > 0
    ? Math.min(requested, 200)
    : 50;
  const search = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
  const sort = parseSort(req.query.sort);

  // Request enough live rows to sort locally because the documented Gate
  // sort enum values are not yet specified.
  const adapter = new GatePredictionAdapter({
    apiUrl: process.env.GATE_DEXBUILDER_API_URL,
  });
  const result = await adapter.listMarkets({ limit: 200, search });
  const markets = result.markets
    .sort(comparator(sort))
    .slice(0, limit)
    .map((market) => ({
      // Gate's stable market_id is the Backspace route id as well.
      id: market.externalId,
      ...market,
    }));

  res.setHeader('Cache-Control', 'private, no-store');
  res.json(markets);
});

function parseSort(raw: unknown): SortKey {
  return raw === 'trending' || raw === 'volume' || raw === 'volume_asc'
    ? raw
    : 'closing';
}

function comparator(sort: SortKey) {
  return (a: { closesAt: Date; volumeUsd: string | null; volume24hUsd: string | null }, b: { closesAt: Date; volumeUsd: string | null; volume24hUsd: string | null }) => {
    if (sort === 'closing') return a.closesAt.getTime() - b.closesAt.getTime();
    const field = sort === 'trending' ? 'volume24hUsd' : 'volumeUsd';
    const delta = Number(a[field] ?? -1) - Number(b[field] ?? -1);
    return sort === 'volume_asc' ? delta : -delta;
  };
}

export default handler;

