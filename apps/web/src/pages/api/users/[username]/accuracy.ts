// GET /api/users/[username]/accuracy
//
// Returns the target user's Polymarket-derived accuracy stats —
// resolved positions, hit rate, stake-weighted Brier score. Reads
// from the UserAccuracy row populated by Phase 10.4's worker.
//
// Privacy: stats are visible only when EITHER:
//   - the user has flipped User.publicAccuracy true (10.6 wires this
//     toggle), OR
//   - the viewer is the target user themselves (always see your own).
//
// 404 — user does not exist.
// 200 + null payload — user exists but hasn't opted in / has no
//                       resolved positions yet. Distinguished so the
//                       UI can render "no stats yet" vs "private."
// 200 + stats payload  — visible.

import prisma from '@src/api2/prisma';
import createHandler from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';

const handler = createHandler();

handler.get(async (req, res) => {
  const username = req.query.username as string;
  if (!username) return res.status(HttpStatus.BAD_REQUEST).end('username required');

  const target = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      authId: true,
      publicAccuracy: true,
      accuracy: {
        select: {
          resolvedPositions: true,
          correctPositions: true,
          weightedBrierScore: true,
          rankingScore: true,
          lastRecomputedAt: true,
        },
      },
    },
  });
  if (!target) return res.status(HttpStatus.NOT_FOUND).end();

  const isSelf = !!req.authId && req.authId === target.authId;
  const canSee = target.publicAccuracy || isSelf;
  if (!canSee) {
    // Existing but hidden — distinguish from "no stats" so the UI
    // can choose to show a small "private" hint to the viewer (or
    // simply render nothing).
    return res.json({ visible: false, stats: null });
  }

  if (!target.accuracy || target.accuracy.resolvedPositions === 0) {
    return res.json({ visible: true, stats: null });
  }

  const accuracyPct = target.accuracy.resolvedPositions > 0
    ? target.accuracy.correctPositions / target.accuracy.resolvedPositions
    : null;

  return res.json({
    visible: true,
    isSelf,
    stats: {
      resolvedPositions: target.accuracy.resolvedPositions,
      correctPositions: target.accuracy.correctPositions,
      accuracy: accuracyPct,
      weightedBrierScore:
        target.accuracy.weightedBrierScore !== null
          ? Number(target.accuracy.weightedBrierScore.toString())
          : null,
      rankingScore: Number(target.accuracy.rankingScore.toString()),
      lastRecomputedAt: target.accuracy.lastRecomputedAt,
    },
  });
});

export default handler;
