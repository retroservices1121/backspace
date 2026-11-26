// Live Gate DexBuilder market gateway. No market data is persisted.
//
// `?product=prediction|event_contracts` selects the Gate product. Without it,
// Prediction Markets is tried first and Event Contracts second.

import { gateCatalogAdapter } from '@backspace/markets';
import HttpStatus from 'http-status-codes';

import { parseGateProduct, productsFor } from '@src/lib/gate/product';
import createHandler from '@src/lib/nextconnect';

const handler = createHandler();

handler.get(async (req, res) => {
  const marketId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!marketId) return res.status(HttpStatus.BAD_REQUEST).end('market id required');

  const products = productsFor(parseGateProduct(req.query.product, 'all'));
  for (const product of products) {
    const adapter = gateCatalogAdapter(product, process.env.GATE_DEXBUILDER_API_URL);
    // eslint-disable-next-line no-await-in-loop
    const market = await adapter.getMarket({ venue: 'GATE', externalId: marketId });
    if (market) {
      res.setHeader('Cache-Control', 'private, no-store');
      return res.json({ id: market.externalId, ...market });
    }
  }
  res.setHeader('Cache-Control', 'private, no-store');
  return res.status(HttpStatus.NOT_FOUND).end();
});

export default handler;
