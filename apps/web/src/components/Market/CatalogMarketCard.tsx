// Standalone catalog connector — the market data comes pre-loaded from
// /api/markets (the MARKETS feed filter pulls the whole catalog in one
// shot, so we skip the per-card useMarket fetch). Trade path + wallet
// gating come from useTrade + <WalletReadiness />.

import { useTrade } from '@src/hooks/useTrade';

import { MarketCard, MarketCardData } from './MarketCard';
import { WalletReadiness } from './WalletReadiness';

type Props = {
  market: MarketCardData;
};

export function CatalogMarketCard({ market }: Props) {
  const { walletConnected, walletBalanceUsd, handleTrade } = useTrade(market);

  return (
    <MarketCard
      market={market}
      walletConnected={walletConnected}
      walletBalanceUsd={walletBalanceUsd}
      onTrade={handleTrade}
      readinessSlot={<WalletReadiness />}
    />
  );
}
