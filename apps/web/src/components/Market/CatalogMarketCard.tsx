// Standalone catalog connector — the market data comes pre-loaded from
// /api/markets (the MARKETS feed filter pulls the whole catalog in one
// shot, so we skip the per-card useMarket fetch). Trade path + wallet
// gating come from useTrade + <WalletReadiness />.

import { useLivePrices } from '@src/hooks/useLivePrices';
import { useTrade } from '@src/hooks/useTrade';
import { useEvmTradeSigner } from '@src/hooks/useTradeSigner';

import { MarketCard, MarketCardData } from './MarketCard';
import { SignerHint } from './SignerHint';
import { WalletReadiness } from './WalletReadiness';

type Props = {
  market: MarketCardData;
};

export function CatalogMarketCard({ market }: Props) {
  // Auto-pick signer: linked wallet (if any) > embedded. SignerHint
  // discloses the popup target without forcing a picker.
  const { wallet } = useEvmTradeSigner();
  const { walletConnected, walletBalanceUsd, handleTrade } = useTrade(market, wallet);
  const livePrices = useLivePrices(market.outcomes.map((o) => o.externalId));

  return (
    <MarketCard
      market={market}
      walletConnected={walletConnected}
      walletBalanceUsd={walletBalanceUsd}
      onTrade={handleTrade}
      readinessSlot={
        <>
          <WalletReadiness signerWallet={wallet} />
          <SignerHint wallet={wallet} />
        </>
      }
      livePrices={livePrices}
    />
  );
}
