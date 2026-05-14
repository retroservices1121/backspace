// Order placement. The trade card collects only side + shares, so the
// "take a position" flow uses a market order (FOK):
//   BUY  -> amount is the dollar notional (shares x current ask)
//   SELL -> amount is the share count
// builderCode attributes the order to the Backspace builder profile.
import { ClobClient, OrderType, Side } from '@polymarket/clob-client-v2';

import { builderCode } from './config';

export type PlaceOrderArgs = {
  clobClient: ClobClient;
  tokenID: string;
  side: 'BUY' | 'SELL';
  shares: number;
  negRisk: boolean;
};

export async function placeOrder(args: PlaceOrderArgs) {
  const { clobClient, tokenID, side, shares, negRisk } = args;
  const orderSide = side === 'BUY' ? Side.BUY : Side.SELL;

  let amount = shares;
  if (orderSide === Side.BUY) {
    // Market BUY orders are denominated in dollars — convert the share
    // count to notional using the current ask (the price a buyer pays).
    const priceResp = await clobClient.getPrice(tokenID, Side.SELL);
    const ask = parseFloat(
      typeof priceResp === 'string' ? priceResp : priceResp?.price,
    );
    if (!Number.isFinite(ask) || ask <= 0 || ask >= 1) {
      throw new Error('Could not get a valid market price for this outcome');
    }
    amount = shares * ask;
  }

  const tickSize = await clobClient.getTickSize(tokenID);
  const code = builderCode();

  return clobClient.createAndPostMarketOrder(
    {
      tokenID,
      amount,
      side: orderSide,
      ...(code ? { builderCode: code } : {}),
    },
    { tickSize, negRisk },
    OrderType.FOK,
  );
}
