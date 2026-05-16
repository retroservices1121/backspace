// Fetches the current user's Polymarket positions across EVERY Safe
// they own — the Backspace-embedded one (from usePolymarketSession)
// plus the Safe derived from any external EOA they've linked via the
// settings page.
//
// Positions come from Polymarket's Data API via /api/polymarket/positions
// (the venue is the source of truth). Each row carries the originating
// safeAddress so the portfolio UI can badge linked-wallet positions
// distinctly from the on-platform trading wallet's.
//
// react-query dedupes individual Safe queries; the combined view here
// merges results in render order.

import { useQueries, useQuery } from 'react-query';

import { usePolymarketSession } from '@src/hooks/usePolymarketSession';
import { useLinkedWallets } from '@src/hooks/useLinkedWallets';
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

export type SourcedPosition = PolymarketPosition & {
  /** Which Safe holds this position. */
  safeAddress: string;
  /** Where the Safe came from — distinguishes 'platform' (the one
   *  Backspace provisioned when the user enabled trading) from
   *  'linked' (derived from an external EOA the user attached). */
  source: 'platform' | 'linked';
};

async function fetchPositions(
  safeAddress: string,
): Promise<PolymarketPosition[]> {
  const { data } = await axios().get<PolymarketPosition[]>(
    `/polymarket/positions?user=${safeAddress}`,
  );
  return data ?? [];
}

/** Single-Safe query (back-compat for the existing portfolio + accuracy
 *  pages that don't need the combined view). */
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

/** Combined positions across the user's embedded Safe + every linked
 *  EOA's Safe. Tagged with source + safeAddress per row. */
export function useAllPositions() {
  const { safeAddress: platformSafe } = usePolymarketSession();
  const { wallets } = useLinkedWallets();

  // Build the list of (safe, source) to query. Filter out wallets
  // missing a Safe (shouldn't happen after 10.1 caches it on link,
  // but defensive in case Safe derivation fails for some EOA).
  const targets: Array<{ safe: string; source: 'platform' | 'linked' }> = [];
  if (platformSafe) targets.push({ safe: platformSafe, source: 'platform' });
  for (const w of wallets) {
    if (w.safeAddress && w.safeAddress !== platformSafe) {
      targets.push({ safe: w.safeAddress, source: 'linked' });
    }
  }

  const queries = useQueries(
    targets.map((t) => ({
      queryKey: ['polymarket-positions', t.safe],
      queryFn: () => fetchPositions(t.safe),
      enabled: true,
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
    })),
  );

  const positions: SourcedPosition[] = [];
  let isLoading = false;
  let isError = false;
  queries.forEach((q, i) => {
    if (q.isLoading) isLoading = true;
    if (q.isError) isError = true;
    if (q.data) {
      const { safe, source } = targets[i];
      for (const p of q.data) {
        positions.push({ ...p, safeAddress: safe, source });
      }
    }
  });

  return {
    positions,
    isLoading,
    isError,
    /** Number of Safes contributing rows — handy for the empty-state
     *  message ("you have no positions across N wallets"). */
    safeCount: targets.length,
    hasLinkedWallets: targets.some((t) => t.source === 'linked'),
  };
}
