import type { GateProduct } from '@backspace/markets';

export type GateProductSelection = GateProduct | 'all';

/**
 * Parse the `product` query param used by the public catalog routes.
 *   - missing / unknown → 'prediction' (existing callers keep their behavior)
 *   - 'event_contracts' → Event Contracts only
 *   - 'all'             → Prediction Markets and Event Contracts merged
 */
export function parseGateProduct(raw: unknown, fallback: GateProductSelection = 'prediction'): GateProductSelection {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === 'prediction' || value === 'event_contracts' || value === 'all') return value;
  return fallback;
}

export function productsFor(selection: GateProductSelection): GateProduct[] {
  return selection === 'all' ? ['prediction', 'event_contracts'] : [selection];
}

/**
 * Product carried on a detail link or detail request. Only Event Contracts
 * needs to be explicit; anything else is Prediction Markets, so existing
 * `/m/<id>` links keep working unchanged.
 */
export function detailProduct(raw: unknown): GateProduct | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === 'event_contracts' || value === 'prediction' ? value : undefined;
}

/** `?product=event_contracts` for Event Contracts, '' for Prediction Markets. */
export function productQuery(product: GateProduct | null | undefined, joiner: '?' | '&' = '?'): string {
  return product === 'event_contracts' ? `${joiner}product=event_contracts` : '';
}

/** Detail route for a catalog market, preserving its Gate product. */
export function marketHref(market: { id: string; product?: GateProduct | null }): string {
  return `/m/${encodeURIComponent(market.id)}${productQuery(market.product)}`;
}
