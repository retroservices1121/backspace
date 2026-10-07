import { GateAccountGatewayError, gateAccountRequest } from '@src/lib/gate/accountGateway';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

type Assets = {
  daily_pnl?: string;
  fund_total?: string;
  prediction_position_value?: string;
  spot_usdt_balance?: string;
  unclaimed_amount?: string;
};
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
  won?: boolean;
};
type Positions = { items?: Position[] };
const handler = createHandler();

handler.use(requireAuthMiddleware).get(async (req, res) => {
  try {
    const [assets, positions] = await Promise.all([
      gateAccountRequest<Assets>(req.authId, '/api/v4/prediction/assets'),
      gateAccountRequest<Positions>(req.authId, '/api/v4/prediction/positions'),
    ]);
    res.status(200).json({
      total: num(assets.fund_total),
      dailyPnl: num(assets.daily_pnl),
      positionValue: num(assets.prediction_position_value),
      available: num(assets.spot_usdt_balance),
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
      })),
    });
  } catch (error) {
    if (error instanceof GateAccountGatewayError) {
      return res.status(error.status).json({ error: error.message });
    }
    throw error;
  }
});

function num(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
export default handler;
