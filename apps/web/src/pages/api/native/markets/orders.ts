// Place a Gate order for the signed-in user through the Broker API.
//   POST /api/v4/broker/prediction/orders        (product=prediction, default)
//   POST /api/v4/broker/event_contracts/orders   (product=event_contracts)
//
// Field mapping (client → Gate):
//   orderMode   → order_mode  LIMIT | MARKET   (execution mode)
//   orderType   → order_type  GTC | GTD | FOK | FAK  (time-in-force)
//   tokenId, side, price, size, totalCost, clientOrderId, postOnly,
//   sellAll, expireTime → token_id, side, price, size, total_cost,
//   client_order_id, post_only, sell_all, expire_time
//
// Defaults: MARKET orders use FOK (all-or-nothing, so the user gets the
// reviewed amount or nothing) and a market BUY must send totalCost. LIMIT
// orders default to GTC. Gate answers `processing`, which means accepted
// for processing, not filled. Nothing is stored in Backspace's database.

import { gateAccountRequest, parseAccountProduct, sendGateAccountError } from '@src/lib/gate/brokerAccount';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

type OrderMode = 'LIMIT' | 'MARKET';
type OrderType = 'GTC' | 'GTD' | 'FOK' | 'FAK';
type PlaceOrderAccept = { order_id?: string; client_order_id?: string; status?: string; created_at?: number };

const MODES: OrderMode[] = ['LIMIT', 'MARKET'];
const TYPES: OrderType[] = ['GTC', 'GTD', 'FOK', 'FAK'];
const DEFAULT_MARKET_ORDER_TYPE: OrderType = 'FOK';
const DECIMAL = /^\d+(\.\d+)?$/;

const handler = createHandler();
handler.use(requireAuthMiddleware).post(async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  const input = req.body ?? {};
  const parsed = parseOrder(input);
  if ('error' in parsed) return res.status(400).json({ error: parsed.error });
  const product = parseAccountProduct(input.product ?? req.query.product);

  try {
    const result = await gateAccountRequest<PlaceOrderAccept>(req.authId, product, 'orders', {
      method: 'POST',
      body: parsed.order,
    });
    const status = (result.status || 'processing').toLowerCase();
    return res.status(200).json({
      product,
      orderId: result.order_id ?? '',
      clientOrderId: result.client_order_id ?? parsed.order.client_order_id,
      status: status.toUpperCase(),
      // `processing` = accepted by Gate, not filled. Query the order for fills.
      accepted: status === 'processing' || status === 'open' || status === 'matched',
      filled: status === 'matched',
      createdAt: result.created_at ?? null,
    });
  } catch (error) {
    if (sendGateAccountError(res, error)) return undefined;
    throw error;
  }
});

type GateOrderBody = {
  token_id: string;
  side: 'BUY' | 'SELL';
  price?: string;
  size?: string;
  total_cost?: string;
  order_type: OrderType;
  order_mode: OrderMode;
  client_order_id: string;
  post_only?: boolean;
  sell_all?: boolean;
  expire_time?: number;
};

function parseOrder(input: Record<string, unknown>): { order: GateOrderBody } | { error: string } {
  const tokenId = str(input.tokenId);
  const side = str(input.side)?.toUpperCase();
  const clientOrderId = str(input.clientOrderId);
  if (!tokenId || (side !== 'BUY' && side !== 'SELL') || !clientOrderId || clientOrderId.length > 64) {
    return { error: 'Invalid order.' };
  }

  let mode = str(input.orderMode)?.toUpperCase() as OrderMode | undefined;
  let type = str(input.orderType)?.toUpperCase() as string | undefined;
  // Older clients sent the execution mode in orderType.
  if (!mode && (type === 'MARKET' || type === 'LIMIT')) { mode = type; type = undefined; }
  if (type === 'MARKET' || type === 'LIMIT') return { error: 'orderType is time-in-force (GTC, GTD, FOK, FAK). Use orderMode for MARKET or LIMIT.' };
  const price = decimal(input.price);
  const size = decimal(input.size);
  const totalCost = decimal(input.totalCost);
  if (price === null || size === null || totalCost === null) return { error: 'Amounts must be decimal strings.' };
  if (!mode) mode = price ? 'LIMIT' : 'MARKET';
  if (!MODES.includes(mode)) return { error: 'orderMode must be LIMIT or MARKET.' };
  const orderType = (type || (mode === 'MARKET' ? DEFAULT_MARKET_ORDER_TYPE : 'GTC')) as OrderType;
  if (!TYPES.includes(orderType)) return { error: 'orderType must be GTC, GTD, FOK or FAK.' };

  const sellAll = input.sellAll === true;
  const expireTime = typeof input.expireTime === 'number' && Number.isInteger(input.expireTime) ? input.expireTime : undefined;

  if (mode === 'MARKET') {
    if (orderType !== 'FOK' && orderType !== 'FAK') return { error: 'MARKET orders must use FOK or FAK.' };
    if (side === 'BUY' && !positive(totalCost)) return { error: 'A market buy needs totalCost.' };
    if (side === 'SELL' && !positive(size) && !sellAll) return { error: 'A market sell needs size or sellAll.' };
  } else {
    if (!positive(price) || !positive(size)) return { error: 'A limit order needs price and size.' };
    if (orderType === 'GTD' && !expireTime) return { error: 'GTD orders need expireTime (Unix seconds).' };
  }

  // Built in a fixed field order; the Broker client serializes this once and
  // signs exactly the bytes it sends.
  const order: GateOrderBody = {
    token_id: tokenId,
    side,
    ...(price ? { price } : {}),
    ...(size ? { size } : {}),
    ...(totalCost ? { total_cost: totalCost } : {}),
    order_type: orderType,
    order_mode: mode,
    client_order_id: clientOrderId,
    ...(input.postOnly === true && mode === 'LIMIT' ? { post_only: true } : {}),
    ...(sellAll && side === 'SELL' ? { sell_all: true } : {}),
    ...(expireTime && orderType === 'GTD' ? { expire_time: expireTime } : {}),
  };
  return { order };
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/** undefined = absent, null = present but invalid, string = valid decimal. */
function decimal(value: unknown): string | undefined | null {
  if (value === undefined || value === null || value === '') return undefined;
  const text = typeof value === 'number' && Number.isFinite(value) ? String(value) : value;
  return typeof text === 'string' && DECIMAL.test(text) ? text : null;
}

function positive(value: string | undefined): boolean {
  return value !== undefined && Number(value) > 0;
}

export default handler;
