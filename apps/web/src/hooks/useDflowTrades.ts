// Reads the caller's recent Dflow swap audit rows from /api/dflow/trades.
// Used by the portfolio Tokens tab to show "recent activity".

import { useQuery } from 'react-query';

import axios from '@src/lib/axios';

export type DflowTrade = {
  id: string;
  createdAt: string;
  inputMint: string;
  inputAmount: string;
  outputMint: string;
  outputAmount: string;
  txSignature: string;
  venue: string;
  inputToken: { symbol: string; decimals: number; logoURI: string | null } | null;
  outputToken: { symbol: string; decimals: number; logoURI: string | null } | null;
};

async function fetchTrades(): Promise<DflowTrade[]> {
  const { data } = await axios().get<DflowTrade[]>('/dflow/trades?limit=50');
  return data ?? [];
}

export function useDflowTrades(enabled = true) {
  return useQuery(['dflow-trades'], fetchTrades, {
    enabled,
    refetchOnWindowFocus: true,
  });
}
