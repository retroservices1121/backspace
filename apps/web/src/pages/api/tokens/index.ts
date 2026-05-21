// GET /api/tokens — list active spot tokens, with optional substring
// search and sort. Powers both the CreatePost token picker typeahead
// and the standalone /tokens catalog page.
//
// Search matches against either symbol or name, case-insensitive. The
// substring threshold (length >= 1) is looser than the markets picker
// because token symbols are usually 3–4 chars (e.g. "SOL", "WIF").
//
// Sort options:
//   trending     — volumeUsd24h DESC NULLS LAST
//   gainers      — priceChange24h DESC NULLS LAST
//   losers       — priceChange24h ASC NULLS LAST
//   alphabetical — symbol ASC (default for picker; safe fallback)
//
// Identity is required so the route is consistent with the rest of
// the signed-in app, but the response is not user-scoped — every
// signed-in user sees the same catalog snapshot.

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;

type SortKey = 'trending' | 'gainers' | 'losers' | 'alphabetical';

// Prisma's `orderBy` doesn't accept a free SQL fragment, but the
// { field: 'desc', nulls: 'last' } object form is supported on
// Postgres. Tokens never priced will sink to the bottom.
function orderByForSort(sort: SortKey) {
  switch (sort) {
    case 'trending':
      return [{ volumeUsd24h: { sort: 'desc' as const, nulls: 'last' as const } }];
    case 'gainers':
      return [{ priceChange24h: { sort: 'desc' as const, nulls: 'last' as const } }];
    case 'losers':
      return [{ priceChange24h: { sort: 'asc' as const, nulls: 'last' as const } }];
    case 'alphabetical':
    default:
      return [{ symbol: 'asc' as const }];
  }
}

function parseSort(raw: unknown): SortKey {
  const s = typeof raw === 'string' ? raw.toLowerCase() : '';
  if (s === 'trending' || s === 'gainers' || s === 'losers' || s === 'alphabetical') {
    return s;
  }
  return 'alphabetical';
}

const handler = createHandler();
handler.use(requireAuthMiddleware);

handler.get(async (req, res) => {
  const requested = Number.parseInt((req.query.limit as string) ?? '', 10);
  const limit = Number.isFinite(requested) && requested > 0
    ? Math.min(requested, MAX_LIMIT)
    : DEFAULT_LIMIT;

  const q = ((req.query.q as string) ?? '').trim();
  const sort = parseSort(req.query.sort);

  const search = q.length >= 1 ? {
    OR: [
      { symbol: { contains: q, mode: 'insensitive' as const } },
      { name:   { contains: q, mode: 'insensitive' as const } },
    ],
  } : {};

  const tokens = await prisma.token.findMany({
    where: { isActive: true, ...search },
    orderBy: orderByForSort(sort),
    take: limit,
  });

  res.json(
    tokens.map((t) => ({
      id: t.id.toString(),
      mint: t.mint,
      symbol: t.symbol,
      name: t.name,
      decimals: t.decimals,
      logoURI: t.logoURI,
      priceUsd: t.priceUsd?.toString() ?? null,
      priceChange24h: t.priceChange24h != null ? Number(t.priceChange24h.toString()) : null,
      volumeUsd24h: t.volumeUsd24h?.toString() ?? null,
      liquidityUsd: t.liquidityUsd?.toString() ?? null,
      statsAt: t.statsAt?.toISOString() ?? null,
    })),
  );
});

export default handler;
