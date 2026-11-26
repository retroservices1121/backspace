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
