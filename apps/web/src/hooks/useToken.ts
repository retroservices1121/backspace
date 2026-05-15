// Fetches a Token by id from /api/tokens/[id]. Returns the shape
// shared with /api/tokens (list) — symbol, name, decimals, logoURI.
//
// Mirrors useMarket.ts; uses react-query so multiple PostTokenCards
// referencing the same token dedupe to one request.

import { useQuery } from 'react-query';
import axios from '@src/lib/axios';

export type TokenData = {
  id: string;
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string | null;
};

async function fetchToken(id: string): Promise<TokenData> {
  const { data } = await axios().get<TokenData>(`/tokens/${id}`);
  return data;
}

export function useToken(tokenId: string | bigint | null | undefined) {
  const id = tokenId == null ? null : tokenId.toString();
  return useQuery(['token', id], () => fetchToken(id as string), {
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}
