import { useCallback } from 'react';
import { toast } from 'react-toastify';

export type TradeIntent = {
  outcomeExternalId: string;
  side: 'BUY' | 'SELL';
  usdAmount: string;
};

type TradeMarket = { id: string; negRisk: boolean };

// Deliberately contains no Polymarket, Privy, or local-storage fallback.
export function useTrade(_market: TradeMarket) {
  const handleTrade = useCallback(async (_intent: TradeIntent) => {
    toast.info('Gate trading will be enabled after account authorization is connected.');
  }, []);
  return { walletConnected: false, walletBalanceUsd: null, handleTrade };
}

