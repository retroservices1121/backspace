// GET /api/tokens — list active spot tokens, with optional substring
// search. Powers the CreatePost token picker typeahead the same way
// /api/markets powers the market picker.
//
// Search matches against either symbol or name, case-insensitive. The
// substring threshold (length >= 1) is looser than the markets picker
// because token symbols are usually 3–4 chars (e.g. "SOL", "WIF").
//
// Identity is required so the route is consistent with the rest of
// the signed-in app, but the response is not user-scoped — every
// signed-in user sees the same catalog snapshot.

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;

const handler = createHandler();
handler.use(requireAuthMiddleware);

handler.get(async (req, res) => {
  const requested = Number.parseInt((req.query.limit as string) ?? '', 10);
  const limit = Number.isFinite(requested) && requested > 0
    ? Math.min(requested, MAX_LIMIT)
    : DEFAULT_LIMIT;

  const q = ((req.query.q as string) ?? '').trim();

  const search = q.length >= 1 ? {
    OR: [
      { symbol: { contains: q, mode: 'insensitive' as const } },
      { name:   { contains: q, mode: 'insensitive' as const } },
    ],
  } : {};

  const tokens = await prisma.token.findMany({
    where: { isActive: true, ...search },
    orderBy: [{ symbol: 'asc' }],
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
    })),
  );
});

export default handler;
