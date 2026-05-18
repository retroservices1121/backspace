// Public leaderboard of top traders by accuracy ranking. Powers the
// "Top traders · this week" card in the right rail.
//
// Privacy: only users who've opted in via publicAccuracy=true are
// surfaced; everyone else is invisible to the leaderboard regardless
// of how good their numbers are.
//
// Ranking: UserAccuracy.rankingScore is the display-ready 0..1 score
// (Brier + recency decay) we already maintain for the ACCURACY feed.
// Reuse the same source so the rail can't drift from the feed sort.

import prisma from '@src/api2/prisma';
import createHandler from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';
import type { NextApiRequest, NextApiResponse } from 'next';

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

const handler = createHandler();

handler.get(async (req: NextApiRequest, res: NextApiResponse) => {
  const rawLimit = Number(req.query.limit ?? DEFAULT_LIMIT);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT),
  );

  const rows = await prisma.userAccuracy.findMany({
    where: {
      // Surface only users who've explicitly opted into a public score.
      // resolvedPositions > 0 keeps brand-new accounts off the board.
      resolvedPositions: { gt: 0 },
      user: { publicAccuracy: true },
    },
    orderBy: { rankingScore: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          avatar: { select: { path: true, host: true } },
        },
      },
    },
  });

  // Shape the response to what the rail card actually renders.
  const body = rows.map((r, i) => ({
    rank: i + 1,
    userId: r.userId.toString(),
    username: r.user?.username ?? '',
    name: r.user?.name ?? r.user?.username ?? '',
    avatar: r.user?.avatar
      ? `https://${r.user.avatar.host}/${r.user.avatar.path}`
      : null,
    resolvedPositions: r.resolvedPositions,
    correctPositions: r.correctPositions,
    accuracyPct:
      r.resolvedPositions > 0
        ? Math.round((r.correctPositions / r.resolvedPositions) * 100)
        : 0,
    // rankingScore is 0..1; surface as a 3-decimal string so the
    // client doesn't have to know the precision.
    rankingScore: r.rankingScore.toFixed(3),
  }));

  return res.status(HttpStatus.OK).json(body);
});

export default handler;
