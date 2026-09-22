// Live Gate DexBuilder market gateway. No market data is persisted.

import { GatePredictionAdapter } from '@backspace/markets';
import HttpStatus from 'http-status-codes';

import createHandler from '@src/lib/nextconnect';

const handler = createHandler();

handler.get(async (req, res) => {
  const marketId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!marketId) return res.status(HttpStatus.BAD_REQUEST).end('market id required');

  const adapter = new GatePredictionAdapter({
    apiUrl: process.env.GATE_DEXBUILDER_API_URL,
  });
  const market = await adapter.getMarket({ venue: 'GATE', externalId: marketId });
  if (!market) return res.status(HttpStatus.NOT_FOUND).end();

  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ id: market.externalId, ...market });
});

export default handler;

