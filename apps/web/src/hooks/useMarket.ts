// Fetches a Market by id from /api/markets/[id]. Returns MarketCardData-shaped
// data so it can drop straight into <MarketCard />.
//
// Uses react-query (already in deps) so multiple posts referencing the same
// market dedupe to one request and keep prices fresh on a 30s refetch.

import { useQuery } from 'react-query';
import axios from '@src/lib/axios';
import type { MarketCardData } from '@src/components/Market/MarketCard';

type ApiMarket = Omit<MarketCardData, 'closesAt' | 'outcomes'> & {
  closesAt: string;
  outcomes: Array<
    Omit<MarketCardData['outcomes'][number], 'lastPriceAt'> & {
      lastPriceAt: string | null;
    }
  >;
};

async function fetchMarket(id: string): Promise<MarketCardData> {
  const { data } = await axios().get<ApiMarket>(`/markets/${id}`);
  return {
    ...data,
    closesAt: new Date(data.closesAt),
    outcomes: data.outcomes.map((o) => ({
      ...o,
      lastPriceAt: o.lastPriceAt ? new Date(o.lastPriceAt) : null,
    })),
  };
}

export function useMarket(marketId: string | bigint | null | undefined) {
  const id = marketId == null ? null : marketId.toString();
  return useQuery(
    ['market', id],
    () => fetchMarket(id as string),
    {
      enabled: !!id,
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
    },
  );
}
