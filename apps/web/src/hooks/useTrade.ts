// Shared trade handler for the market-card connectors. Routes a BUY/SELL
// intent through the user's Polymarket trading session, then records the
// executed order to our audit log. Both PostMarketCard and
// CatalogMarketCard use it so the trade path lives in exactly one place.
//
// Trade-gating (log in / set up wallet) is surfaced via <WalletReadiness />
// injected as MarketCard's readinessSlot — useTrade only handles the
// happy path where the session is already established.
//
// Polymarket-style accounting: the user expresses an order as a USD
// amount, not a share count. Why USD: at 4¢ per share, $10 buys 250
// shares and pays out $250 if it wins. The CLOB SDK also wants USD
// for market BUYs (and shares for SELLs); see lib/polymarket/order.ts
// for the per-side conversion logic.

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
  /** USD amount, as the user typed it. Validated inside the handler. */
  usdAmount: string;
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
      const usdAmount = Number(intent.usdAmount);
      if (!Number.isFinite(usdAmount) || usdAmount <= 0) {
        toast.error('Enter a USD amount.');
        return;
      }

      try {
        const clobClient = await session.getClobClient();
        const result = await placeOrder({
          clobClient,
          // Outcome.externalId IS the Polymarket CLOB tokenID.
          tokenID: intent.outcomeExternalId,
          side: intent.side,
          usdAmount,
          negRisk: market.negRisk,
        });

        // Record-only — Polymarket already executed. A failed audit
        // write must not surface as a trade failure.
        await axios()
          .post(`/markets/${market.id}/trade`, {
            venueOrderId: result.venueOrderId,
            tokenID: intent.outcomeExternalId,
            side: intent.side,
            // Audit log stores actual filled shares (from Polymarket's
            // response), not the user's input — keeps the audit table
            // talking the same unit as Polymarket's own positions data.
            shares: result.filledShares != null
              ? String(result.filledShares)
              : String(result.requestedShares ?? 0),
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
