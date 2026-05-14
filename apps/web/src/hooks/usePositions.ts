// Fetches the current user's Polymarket positions from
// /api/polymarket/positions, which proxies Polymarket's Data API (the
// source of truth — positions are not recomputed locally).
//
// The Safe address comes from usePolymarketSession (deterministic, so
// it's available before any trade). react-query dedupes + keeps the
// portfolio fresh on an interval.

import { useQuery } from 'react-query';

import { usePolymarketSession } from '@src/hooks/usePolymarketSession';
import axios from '@src/lib/axios';

// Subset of Polymarket Data API position fields the portfolio renders.
// The upstream payload has more; we only type what we use.
export type PolymarketPosition = {
  asset: string;
  conditionId: string;
  title: string;
  outcome: string;
  icon: string | null;
  size: number;
  avgPrice: number;
  curPrice: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  redeemable: boolean;
};

async function fetchPositions(
  safeAddress: string,
): Promise<PolymarketPosition[]> {
  const { data } = await axios().get<PolymarketPosition[]>(
    `/polymarket/positions?user=${safeAddress}`,
  );
  return data ?? [];
}

export function usePositions() {
  const { safeAddress } = usePolymarketSession();
  const query = useQuery(
    ['polymarket-positions', safeAddress],
    () => fetchPositions(safeAddress as string),
    {
      enabled: !!safeAddress,
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
    },
  );
  return { ...query, safeAddress };
}
