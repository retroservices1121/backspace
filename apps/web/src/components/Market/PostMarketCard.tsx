// Connector component: drops into a feed post and renders <MarketCard /> if
// the post has a marketId. Handles loading/error states; the trade path and
// wallet gating come from useTrade + <WalletReadiness />. The bare
// <MarketCard /> is presentational only.

import { useLivePrices } from '@src/hooks/useLivePrices';
import { useMarket } from '@src/hooks/useMarket';
import { useTrade } from '@src/hooks/useTrade';
import { useEvmTradeSigner } from '@src/hooks/useTradeSigner';

import { MarketCard } from './MarketCard';
import { SignerPicker } from './SignerPicker';
import { WalletReadiness } from './WalletReadiness';

type Props = {
  marketId: bigint | string;
};

export function PostMarketCard({ marketId }: Props) {
  const market = useMarket(marketId);

  if (market.isLoading) {
    return (
      <div className="my-3 h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
    );
  }
  if (market.isError || !market.data) {
    return (
      <div className="my-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
        Couldn’t load market. Try refreshing.
      </div>
    );
  }

  return <TradeableMarketCard market={market.data} />;
}

// Split out so useTrade's hooks only run once market data has resolved.
function TradeableMarketCard({
  market,
}: {
  market: NonNullable<ReturnType<typeof useMarket>['data']>;
}) {
  // Lifted signer state — both the readiness gate and the trade hook
  // key off the same selection. Embedded wallet by default; the picker
  // only renders when there's a linked wallet to choose from.
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
