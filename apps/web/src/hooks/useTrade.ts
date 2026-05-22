// Shared trade handler for the market-card connectors. Routes a BUY/SELL
// intent through the user's Polymarket trading session, then records the
// executed order to our audit log. Both PostMarketCard and
// CatalogMarketCard use it so the trade path lives in exactly one place.
//
// Trade-gating (log in / set up wallet) is surfaced via <WalletReadiness />
// injected as MarketCard's readinessSlot — useTrade only handles the
// happy path where the session is already established.
import { useCallback } from 'react';
import { useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

import { usePolymarketSession } from '@src/hooks/usePolymarketSession';
import axios from '@src/lib/axios';
import { placeOrder } from '@src/lib/polymarket';
import type { EvmWallet } from '@src/lib/wallet/types';

export type TradeIntent = {
  outcomeExternalId: string;
  side: 'BUY' | 'SELL';
  shares: string;
};

type TradeMarket = {
  // DB Market.id — the record route keys on this, not the venue's
  // condition_id (externalId).
  id: string;
  negRisk: boolean;
};

export function useTrade(market: TradeMarket, signerWallet?: EvmWallet | null) {
  // Caller picks the signer (embedded or any linked EVM wallet). Default
  // (no arg) keeps the historical behavior: embedded wallet only.
  const session = usePolymarketSession(signerWallet);
  const queryClient = useQueryClient();

  const handleTrade = useCallback(
    async (intent: TradeIntent) => {
      if (!session.isReady) {
        toast.error('Set up your trading wallet to place orders.');
        return;
      }
      const shares = Number(intent.shares);
      if (!Number.isFinite(shares) || shares <= 0) {
        toast.error('Enter a valid number of shares.');
        return;
      }

      try {
        const clobClient = await session.getClobClient();
        const result = await placeOrder({
          clobClient,
          // Outcome.externalId IS the Polymarket CLOB tokenID.
          tokenID: intent.outcomeExternalId,
          side: intent.side,
          shares,
          negRisk: market.negRisk,
        });

        // Record-only — Polymarket already executed. A failed audit
        // write must not surface as a trade failure.
        await axios()
          .post(`/markets/${market.id}/trade`, {
            venueOrderId: result.venueOrderId,
            tokenID: intent.outcomeExternalId,
            side: intent.side,
            shares: String(result.filledShares ?? shares),
            priceUsd: result.priceUsd != null ? String(result.priceUsd) : null,
            status: result.status,
            safeAddress: session.safeAddress,
          })
          .catch(() => undefined);

        toast.success(`${intent.side} order placed`);
        queryClient.invalidateQueries(['polymarket-positions']);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Order failed');
      }
    },
    [session, queryClient, market.id, market.negRisk],
  );

  return {
    // Drives MarketCard's submit button: enabled only once the trading
    // session is established. WalletReadiness covers the gating UI.
    walletConnected: session.isReady,
    walletBalanceUsd: session.collateralBalance,
    handleTrade,
  };
}
