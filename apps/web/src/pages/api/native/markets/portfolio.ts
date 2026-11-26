// Signed-in user's Gate account summary and positions via the Broker API.
//   prediction (default):  GET /api/v4/broker/prediction/assets + /positions
//   event_contracts:       GET /api/v4/broker/event_contracts/assets
//                          + /positions (+ /balance for available funds)
// Served live from Gate; nothing is persisted.

import { gateAccountRequest, parseAccountProduct, sendGateAccountError } from '@src/lib/gate/brokerAccount';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

type Assets = {
  daily_pnl?: string;
  daily_pnl_rate?: string;
  fund_total?: string;
  prediction_market_asset?: string;
  prediction_position_value?: string;
  spot_usdt_balance?: string;
  unclaimed_amount?: string;
};
type Balance = { available?: string; currency?: string; locked?: string; total?: string };
type Position = {
  available_size?: string;
  avg_open_price?: string;
  claimable_amount?: string;
  event_id?: string;
  locked_size?: string;
  outcome?: string;
  position_id?: string;
  position_value?: string;
  settlement_status?: string;
  size?: string;
  token_id?: string;
  updated_at?: number;
  won?: boolean;
};
type Positions = { items?: Position[]; next_cursor?: string | null };
const handler = createHandler();

handler.use(requireAuthMiddleware).get(async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  const product = parseAccountProduct(req.query.product);
  try {
    const [assets, positions, balance] = await Promise.all([
      gateAccountRequest<Assets>(req.authId, product, 'assets'),
      gateAccountRequest<Positions>(req.authId, product, 'positions'),
      product === 'event_contracts'
        ? gateAccountRequest<Balance>(req.authId, product, 'balance').catch((): Balance | null => null)
        : Promise.resolve(null as Balance | null),
    ]);
    res.status(200).json({
      product,
      total: num(assets.fund_total),
      dailyPnl: num(assets.daily_pnl),
      dailyPnlRate: num(assets.daily_pnl_rate),
      positionValue: num(assets.prediction_position_value),
      marketAsset: num(assets.prediction_market_asset),
      available: balance && balance.available !== undefined ? num(balance.available) : num(assets.spot_usdt_balance),
      unclaimed: num(assets.unclaimed_amount),
      positions: (positions.items ?? []).map((position) => ({
        positionId: position.position_id ?? '',
        eventId: position.event_id ?? '',
        tokenId: position.token_id ?? '',
        outcome: position.outcome ?? '',
        size: num(position.size),
        averagePrice: num(position.avg_open_price),
        value: num(position.position_value),
        availableSize: num(position.available_size),
        lockedSize: num(position.locked_size),
        claimableAmount: num(position.claimable_amount),
        settlementStatus: position.settlement_status ?? 'UNSETTLED',
        won: Boolean(position.won),
        updatedAt: position.updated_at ?? null,
      })),
    });
  } catch (error) {
    if (sendGateAccountError(res, error)) return;
    throw error;
  }
});

function num(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
export default handler;
