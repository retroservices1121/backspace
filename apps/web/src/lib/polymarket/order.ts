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

// Normalized result the trade UI + audit log consume. The raw CLOB
// response is typed `any` by clob-client-v2; we only read the fields
// the V2 OrderResponse interface documents.
export type PlaceOrderResult = {
  venueOrderId: string | null;
  status: string;
  side: 'BUY' | 'SELL';
  // Shares the user asked for vs. what actually filled (FOK should
  // match, but read it back rather than assume).
  requestedShares: number;
  filledShares: number | null;
  // Average fill price per share, in USD (0..1).
  priceUsd: number | null;
  raw: unknown;
};

type RawOrderResponse = {
  success?: boolean;
  errorMsg?: string;
  orderID?: string;
  status?: string;
  takingAmount?: string;
  makingAmount?: string;
};

function normalize(
  side: 'BUY' | 'SELL',
  requestedShares: number,
  resp: RawOrderResponse,
): PlaceOrderResult {
  const making = parseFloat(resp.makingAmount ?? '');
  const taking = parseFloat(resp.takingAmount ?? '');
  let filledShares: number | null = null;
  let priceUsd: number | null = null;
  if (Number.isFinite(making) && Number.isFinite(taking)) {
    if (side === 'BUY') {
      // making = USD spent, taking = shares received.
      filledShares = taking;
      priceUsd = taking > 0 ? making / taking : null;
    } else {
      // making = shares sold, taking = USD received.
      filledShares = making;
      priceUsd = making > 0 ? taking / making : null;
    }
  }
  return {
    venueOrderId: resp.orderID || null,
    status: resp.status ?? 'UNKNOWN',
    side,
    requestedShares,
    filledShares,
    priceUsd,
    raw: resp,
  };
}

export async function placeOrder(
  args: PlaceOrderArgs,
): Promise<PlaceOrderResult> {
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

  const resp = await clobClient.createAndPostMarketOrder(
    {
      tokenID,
      amount,
      side: orderSide,
      ...(code ? { builderCode: code } : {}),
    },
    { tickSize, negRisk },
    OrderType.FOK,
  );

  const result = normalize(side, shares, (resp ?? {}) as RawOrderResponse);
  if (result.status === 'UNKNOWN' && (resp as RawOrderResponse)?.success === false) {
    throw new Error(
      (resp as RawOrderResponse)?.errorMsg || 'Polymarket rejected the order',
    );
  }
  return result;
}
