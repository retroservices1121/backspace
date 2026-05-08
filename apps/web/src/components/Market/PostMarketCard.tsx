// Connector component: drops into a feed post and renders <MarketCard /> if
// the post has a marketId. Handles loading/error states and pulls wallet
// state from Privy. The bare <MarketCard /> is presentational only.

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useMarket } from '@src/hooks/useMarket';
import axios from '@src/lib/axios';
import { MarketCard } from './MarketCard';

type Props = {
  marketId: bigint | string;
};

export function PostMarketCard({ marketId }: Props) {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
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

  const walletConnected = authenticated && wallets.length > 0;
  // Real balance fetch happens in Phase 4 (trade-from-timeline) when we wire
  // the venue adapter's quote() into the UI; for now we know "wallet linked"
  // but not "wallet funded" — display state, not enforcement.
  const walletBalanceUsd = null;

  async function handleTrade(intent: {
    outcomeExternalId: string;
    side: 'BUY' | 'SELL';
    shares: string;
  }) {
    // Trade submission flows through @backspace/markets quote() then submit().
    // Server-side route /api/markets/[id]/trade is the natural mount point —
    // not implemented in this slice; this stub posts the intent so the
    // network call is visible end-to-end.
    await axios().post(`/markets/${marketId}/trade`, intent).catch((e) => {
      // eslint-disable-next-line no-console
      console.warn('trade submit not yet implemented', e?.response?.status);
    });
  }

  return (
    <MarketCard
      market={market.data}
      walletConnected={walletConnected}
      walletBalanceUsd={walletBalanceUsd}
      onTrade={handleTrade}
    />
  );
}
