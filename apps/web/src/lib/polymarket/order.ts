// Order placement against Polymarket CLOB V2.
//
// The user expresses an order as a USD amount, Polymarket-style.
// The CLOB SDK's market orders are denominated differently per side
// (legacy quirk we just wrap around):
//   BUY  -> SDK takes USD notional. We pass the user's usdAmount as-is.
//   SELL -> SDK takes share count. We convert usdAmount → shares using
//           the current bid (the price a seller actually receives) so
//           the resulting USD value is approximately what the user
//           asked for.
//
// builderCode attributes the order to the Backspace builder profile
// for fee accounting on Polymarket's side.

import { ClobClient, OrderType, Side } from '@polymarket/clob-client-v2';

import { builderCode } from './config';

export type PlaceOrderArgs = {
  clobClient: ClobClient;
  tokenID: string;
  side: 'BUY' | 'SELL';
  /** USD amount as a positive finite number — validated by the hook. */
  usdAmount: number;
  negRisk: boolean;
};

// Normalized result the trade UI + audit log consume. The raw CLOB
// response is typed `any` by clob-client-v2; we only read the fields
// the V2 OrderResponse interface documents.
export type PlaceOrderResult = {
  venueOrderId: string | null;
  status: string;
  side: 'BUY' | 'SELL';
  // What the user requested vs. what actually filled. requestedShares
  // is a derived estimate (usdAmount / observed price), useful for
  // audit logs when the SDK doesn't echo back the input.
  requestedShares: number | null;
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
  requestedShares: number | null,
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
  const { clobClient, tokenID, side, usdAmount, negRisk } = args;
  const orderSide = side === 'BUY' ? Side.BUY : Side.SELL;

  // What we send to the SDK depends on the side. Capture the
  // estimated share count we expect to trade so we can echo it back
  // to the audit log if Polymarket doesn't (it usually does).
  let amount = usdAmount;
  let requestedShares: number | null = null;

  if (orderSide === Side.SELL) {
    // SELL is share-denominated. Convert using the current bid — what
    // a seller receives per share — so the dollar value approximates
    // the user's input. Bid = price a buyer pays at = Side.SELL on
    // the get-price call (which asks "what is the SELL price?", i.e.
    // the bid).
    const priceResp = await clobClient.getPrice(tokenID, Side.BUY);
    const bid = parseFloat(
      typeof priceResp === 'string' ? priceResp : priceResp?.price,
    );
    if (!Number.isFinite(bid) || bid <= 0 || bid >= 1) {
      throw new Error('Could not get a valid market price for this outcome');
    }
    const shares = usdAmount / bid;
    amount = shares;
    requestedShares = shares;
  } else {
    // BUY estimate: how many shares the user *should* get at the
    // current ask. Useful for the audit log when the SDK echo is
    // missing. Doesn't change what we send.
    const priceResp = await clobClient.getPrice(tokenID, Side.SELL).catch(() => null);
    if (priceResp) {
      const ask = parseFloat(
        typeof priceResp === 'string' ? priceResp : priceResp?.price,
      );
      if (Number.isFinite(ask) && ask > 0 && ask < 1) {
        requestedShares = usdAmount / ask;
      }
    }
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

  const result = normalize(side, requestedShares, (resp ?? {}) as RawOrderResponse);
  if (result.status === 'UNKNOWN' && (resp as RawOrderResponse)?.success === false) {
    throw new Error(
      (resp as RawOrderResponse)?.errorMsg || 'Polymarket rejected the order',
    );
  }
  return result;
}
