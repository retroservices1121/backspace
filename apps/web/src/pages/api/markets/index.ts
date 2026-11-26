// Live Gate DexBuilder catalog gateway. No market data is persisted.
//
// Query params:
//   limit   1–200 rows returned (default 50)
//   q       case-insensitive question search
//   sort    closing | trending | volume | volume_asc
//   product prediction (default) | event_contracts | all
//
// Every market carries `product` so clients can tell Prediction Markets from
// Event Contracts. Gate list calls are paged at 100 rows per request.

import { gateCatalogAdapter, type VenueMarket } from '@backspace/markets';

import { parseGateProduct, productsFor } from '@src/lib/gate/product';
import createHandler from '@src/lib/nextconnect';

type SortKey = 'closing' | 'trending' | 'volume' | 'volume_asc';

// Rows collected per product before local sorting. Gate does not document
// sort values for market lists, so a wider window keeps sorts meaningful.
const SORT_WINDOW = 200;

const handler = createHandler();

handler.get(async (req, res) => {
  const requested = Number.parseInt((req.query.limit as string) ?? '', 10);
  const limit = Number.isFinite(requested) && requested > 0
    ? Math.min(requested, 200)
    : 50;
  const search = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
  const sort = parseSort(req.query.sort);
  const products = productsFor(parseGateProduct(req.query.product));

  const results = await Promise.all(products.map(async (product) => {
    const adapter = gateCatalogAdapter(product, process.env.GATE_DEXBUILDER_API_URL);
    const result = await adapter.listMarkets({ limit: Math.max(limit, SORT_WINDOW), search });
    return result.markets;
  }));

  const markets = ([] as VenueMarket[]).concat(...results)
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
