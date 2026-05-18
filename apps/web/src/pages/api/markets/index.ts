// GET /api/markets — list active markets with selectable sort.
//
// Powers the "Markets" feed filter and the /markets catalog page.
// Wire shape mirrors GET /api/markets/[id]: venue + externalId +
// question + outcomes (Decimal columns serialized as strings, never
// floats), plus volume snapshots refreshed by the import cron.
//
// Identity required for consistency, but the response is not
// user-scoped — every signed-in user sees the same catalog snapshot.
//
// Sorts:
//   closing  (default) — soonest closing first (closesAt asc)
//   trending           — highest 24h volume (volume24hUsd desc)
//   volume             — highest all-time volume (volumeUsd desc)
//   volume_asc         — lowest all-time volume first
// All volume sorts put NULL volumes last so freshly-imported markets
// without a snapshot don't appear above ranked ones.

import { MarketStatus, Prisma } from '@prisma/client';

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

type SortKey = 'closing' | 'trending' | 'volume' | 'volume_asc';

const SORT_KEYS: ReadonlySet<SortKey> = new Set(['closing', 'trending', 'volume', 'volume_asc']);

function parseSort(raw: unknown): SortKey {
  return typeof raw === 'string' && SORT_KEYS.has(raw as SortKey)
    ? (raw as SortKey)
    : 'closing';
}

function orderByFor(sort: SortKey): Prisma.MarketOrderByWithRelationInput[] {
  switch (sort) {
    case 'trending':
      return [
        { volume24hUsd: { sort: 'desc', nulls: 'last' } },
        { closesAt: 'asc' },
      ];
    case 'volume':
      return [
        { volumeUsd: { sort: 'desc', nulls: 'last' } },
        { closesAt: 'asc' },
      ];
    case 'volume_asc':
      return [
        { volumeUsd: { sort: 'asc', nulls: 'last' } },
        { closesAt: 'asc' },
      ];
    case 'closing':
    default:
      return [{ closesAt: 'asc' }];
  }
}

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
  const sort = parseSort(req.query.sort);

  const markets = await prisma.market.findMany({
    where: {
      status: MarketStatus.ACTIVE,
      closesAt: { gt: new Date() },
      ...(q.length >= 2
        ? { question: { contains: q, mode: 'insensitive' as const } }
        : {}),
    },
    include: { outcomes: true },
    orderBy: orderByFor(sort),
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
      volumeUsd: m.volumeUsd ? m.volumeUsd.toString() : null,
      volume24hUsd: m.volume24hUsd ? m.volume24hUsd.toString() : null,
      liquidityUsd: m.liquidityUsd ? m.liquidityUsd.toString() : null,
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
