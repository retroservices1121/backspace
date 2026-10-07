import { GateAccountGatewayError, gateAccountRequest } from '@src/lib/gate/accountGateway';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

const handler = createHandler();
handler.use(requireAuthMiddleware).post(async (req, res) => {
  const {
    tokenId, side, price, size, totalCost, orderType, orderMode, clientOrderId,
  } = req.body ?? {};
  if (!tokenId || !['BUY', 'SELL'].includes(side) || !clientOrderId) {
    return res.status(400).json({ error: 'Invalid order.' });
  }
  try {
    const result = await gateAccountRequest<{ order_id?: string; status?: string }>(
      req.authId,
      '/api/v4/prediction/orders',
      {
        method: 'POST',
        body: compact({
          token_id: tokenId,
          side,
          price,
          size,
          total_cost: totalCost,
          order_type: orderType,
          order_mode: orderMode,
          client_order_id: clientOrderId,
        }),
      },
    );
    return res.status(200).json({ orderId: result.order_id ?? '', status: result.status ?? 'PROCESSING' });
  } catch (error) {
    if (error instanceof GateAccountGatewayError) {
      return res.status(error.status).json({ error: error.message });
    }
    throw error;
  }
});

function compact<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''),
  );
}
export default handler;
