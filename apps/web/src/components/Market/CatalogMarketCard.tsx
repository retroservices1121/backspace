// Standalone catalog connector — the market data comes pre-loaded from
// /api/markets (the MARKETS feed filter pulls the whole catalog in one
// shot, so we skip the per-card useMarket fetch). Trade path + wallet
// gating come from useTrade + <WalletReadiness />.

import { useLivePrices } from '@src/hooks/useLivePrices';
import { useTrade } from '@src/hooks/useTrade';
import { useEvmTradeSigner } from '@src/hooks/useTradeSigner';

import { MarketCard, MarketCardData } from './MarketCard';
import { SignerPicker } from './SignerPicker';
import { WalletReadiness } from './WalletReadiness';

type Props = {
  market: MarketCardData;
};

export function CatalogMarketCard({ market }: Props) {
  // Same signer-picker pattern as PostMarketCard — the dropdown only
  // renders when the user has more than one wallet (embedded + linked).
  const { candidates, selected, setSelected } = useEvmTradeSigner();
  const { walletConnected, walletBalanceUsd, handleTrade } = useTrade(market, selected);
  const livePrices = useLivePrices(market.outcomes.map((o) => o.externalId));

  return (
    <MarketCard
      market={market}
      walletConnected={walletConnected}
      walletBalanceUsd={walletBalanceUsd}
      onTrade={handleTrade}
      readinessSlot={
        <>
          <SignerPicker
            candidates={candidates}
            selected={selected}
            onSelect={setSelected}
          />
          <WalletReadiness signerWallet={selected} />
        </>
      }
      livePrices={livePrices}
    />
  );
}
