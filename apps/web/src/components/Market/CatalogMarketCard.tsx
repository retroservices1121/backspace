// Standalone catalog connector — same wallet wiring as PostMarketCard but
// the market data comes pre-loaded from /api/markets (the MARKETS feed
// filter pulls the whole catalog in one shot, so we skip the per-card
// useMarket fetch).

import { usePrivy, useWallets } from '@privy-io/react-auth';
import axios from '@src/lib/axios';
import { MarketCard, MarketCardData } from './MarketCard';

type Props = {
  market: MarketCardData;
};

export function CatalogMarketCard({ market }: Props) {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();

  const walletConnected = authenticated && wallets.length > 0;
  const walletBalanceUsd = null;

  async function handleTrade(intent: {
    outcomeExternalId: string;
    side: 'BUY' | 'SELL';
    shares: string;
  }) {
    await axios()
      .post(`/markets/${market.externalId}/trade`, intent)
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn('trade submit not yet implemented', e?.response?.status);
      });
  }

  return (
    <MarketCard
      market={market}
      walletConnected={walletConnected}
      walletBalanceUsd={walletBalanceUsd}
      onTrade={handleTrade}
    />
  );
}
