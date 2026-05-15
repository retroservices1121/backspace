// GET /api/markets — list active markets, soonest-closing first.
//
// Powers the "Markets" feed filter (browse the catalog directly without
// a Post wrapper). Wire shape mirrors GET /api/markets/[id]: venue +
// externalId + question + outcomes (Decimal columns serialized as
// strings, never floats), one row per market.
//
// Identity is required so the route is consistent with the rest of the
// signed-in app, but the response is not user-scoped — every signed-in
// user sees the same catalog snapshot.

import { MarketStatus } from '@prisma/client';

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const handler = createHandler();
handler.use(requireAuthMiddleware);

handler.get(async (req, res) => {
  const requested = Number.parseInt((req.query.limit as string) ?? '', 10);
  const limit = Number.isFinite(requested) && requested > 0
    ? Math.min(requested, MAX_LIMIT)
    : DEFAULT_LIMIT;

  // Optional question search — powers the CreatePost market picker
  // typeahead. Case-insensitive substring; ignored when empty/short.
  const q = ((req.query.q as string) ?? '').trim();

  const markets = await prisma.market.findMany({
    where: {
      status: MarketStatus.ACTIVE,
      closesAt: { gt: new Date() },
      ...(q.length >= 2
        ? { question: { contains: q, mode: 'insensitive' as const } }
        : {}),
    },
    include: { outcomes: true },
    orderBy: { closesAt: 'asc' },
    take: limit,
  });

  res.json(
    markets.map((m) => ({
      id: m.id.toString(),
      venue: m.venue,
      externalId: m.externalId,
      question: m.question,
      description: m.description,
      category: m.category,
      imageUrl: m.imageUrl,
      chain: m.chain,
      contractAddress: m.contractAddress,
      negRisk: m.negRisk,
      status: m.status,
      opensAt: m.opensAt,
      closesAt: m.closesAt,
      resolvedAt: m.resolvedAt,
      outcomes: m.outcomes.map((o) => ({
        externalId: o.externalId,
        label: o.label,
        lastPrice: o.lastPrice ? o.lastPrice.toString() : null,
        lastPriceAt: o.lastPriceAt,
      })),
    })),
  );
});

export default handler;
