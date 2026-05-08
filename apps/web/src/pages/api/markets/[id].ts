// GET /api/markets/[id]  — return a single market with its outcomes,
// shaped to match MarketCardData on the client. The Decimal columns are
// serialized as strings on the wire (never floats).

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';

const handler = createHandler();
handler.use(requireAuthMiddleware);

handler.get(async (req, res) => {
  const market = await prisma.market.findUnique({
    where: { id: BigInt(req.query.id as string) },
    include: { outcomes: true },
  });
  if (!market) return res.status(HttpStatus.NOT_FOUND).end();

  res.json({
    venue: market.venue,
    externalId: market.externalId,
    question: market.question,
    description: market.description,
    category: market.category,
    imageUrl: market.imageUrl,
    chain: market.chain,
    contractAddress: market.contractAddress,
    status: market.status,
    opensAt: market.opensAt,
    closesAt: market.closesAt,
    resolvedAt: market.resolvedAt,
    outcomes: market.outcomes.map((o) => ({
      externalId: o.externalId,
      label: o.label,
      lastPrice: o.lastPrice ? o.lastPrice.toString() : null,
      lastPriceAt: o.lastPriceAt,
    })),
  });
});

export default handler;
