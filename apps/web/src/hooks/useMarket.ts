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

type GateProduct = 'prediction' | 'event_contracts';

async function fetchMarket(id: string, product?: GateProduct): Promise<MarketCardData> {
  // Without a product the API tries Prediction Markets, then Event Contracts.
  const { data } = await axios().get<ApiMarket>(
    `/markets/${encodeURIComponent(id)}${product ? `?product=${product}` : ''}`,
  );
  return {
    ...data,
    closesAt: new Date(data.closesAt),
    outcomes: data.outcomes.map((o) => ({
      ...o,
      lastPriceAt: o.lastPriceAt ? new Date(o.lastPriceAt) : null,
    })),
  };
}

export function useMarket(marketId: string | bigint | null | undefined, product?: GateProduct) {
  const id = marketId == null ? null : marketId.toString();
  return useQuery(
    ['market', id, product || null],
    () => fetchMarket(id as string, product),
    {
      enabled: !!id,
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
    },
  );
}
