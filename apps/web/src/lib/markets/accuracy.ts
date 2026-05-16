// Polymarket accuracy aggregation.
//
// Reads PolymarketPositionSnapshot rows (populated by Phase 10.3's
// worker) and computes per-user accuracy stats into UserAccuracy:
//
//   - resolvedPositions   = count of settled positions
//   - correctPositions    = count of settled positions where won = true
//   - weightedBrierScore  = stake-weighted Brier across settled positions
//   - rankingScore        = display-friendly 0..1 score after volume
//                           weighting + recency decay
//
// Brier on a single position is (avgPrice - outcome)^2 where outcome
// is 1 if won, 0 if lost. Lower = better calibrated. Weight by stake
// (size * avgPrice — the dollars at risk) so a $1000 well-calibrated
// bet matters more than a $1 hunch.
//
// Recency decay: bias the ranking score toward recent calls. A trader
// who was sharp two years ago and has been silent shouldn't outrank
// one who's been consistently sharp this quarter. Half-life of ~180d
// keeps stale predictions from dominating the score.
//
// Source of truth: the snapshot table. We don't re-hit the Data API
// here — that's the worker's job. This function is fast and CPU-only.

import prisma from '@src/api2/prisma';
import { Prisma } from '@prisma/client';

export type AccuracySummary = {
  usersProcessed: number;
  rowsWritten: number;
  errors: Array<{ userId: string; message: string }>;
};

const HALF_LIFE_DAYS = 180;
const HALF_LIFE_MS = HALF_LIFE_DAYS * 24 * 60 * 60 * 1000;

/** Recency weight for a single position settled at `settledAt`.
 *  exp(-ln(2) * ageDays / halfLifeDays) — 1.0 today, 0.5 after 180d,
 *  0.25 after 360d. */
function recencyWeight(settledAt: Date, now: number): number {
  const ageMs = Math.max(0, now - settledAt.getTime());
  return Math.exp(-Math.LN2 * ageMs / HALF_LIFE_MS);
}

/** Per-user aggregation step. Pulled out of the worker so the
 *  profile endpoint can also call it on demand for a fresh number
 *  if the cron hasn't ticked yet. */
export async function recomputeUserAccuracy(userId: bigint): Promise<void> {
  const snapshots = await prisma.polymarketPositionSnapshot.findMany({
    where: { userId },
    select: {
      avgPrice: true,
      size: true,
      won: true,
      settledAt: true,
    },
  });

  if (snapshots.length === 0) {
    // Wipe any stale row — a user who unlinked their only wallet
    // shouldn't keep showing yesterday's badge.
    await prisma.userAccuracy.deleteMany({ where: { userId } });
    return;
  }

  const now = Date.now();
  let resolvedPositions = 0;
  let correctPositions = 0;
  let weightedBrierNumer = 0;
  let weightedBrierDenom = 0;
  let recencyWeightedAccuracyNumer = 0;
  let recencyWeightedAccuracyDenom = 0;

  for (const s of snapshots) {
    const avgPrice = Number(s.avgPrice.toString());
    const size = Number(s.size.toString());
    if (!Number.isFinite(avgPrice) || !Number.isFinite(size) || size <= 0) {
      continue;
    }
    const outcome = s.won ? 1 : 0;
    const stake = avgPrice * size; // dollars at risk
    const recency = recencyWeight(s.settledAt, now);

    resolvedPositions += 1;
    if (s.won) correctPositions += 1;

    // Stake-weighted Brier — small bets shouldn't drown out big ones.
    const brierContribution = (avgPrice - outcome) ** 2;
    weightedBrierNumer += brierContribution * stake;
    weightedBrierDenom += stake;

    // Ranking score = recency- AND stake-weighted accuracy in [0,1].
    // Easier to read than raw Brier; we still surface Brier as the
    // calibration receipt.
    recencyWeightedAccuracyNumer += outcome * stake * recency;
    recencyWeightedAccuracyDenom += stake * recency;
  }

  const weightedBrierScore = weightedBrierDenom > 0
    ? weightedBrierNumer / weightedBrierDenom
    : null;
  const rankingScore = recencyWeightedAccuracyDenom > 0
    ? recencyWeightedAccuracyNumer / recencyWeightedAccuracyDenom
    : 0;

  await prisma.userAccuracy.upsert({
    where: { userId },
    create: {
      userId,
      resolvedPositions,
      correctPositions,
      weightedBrierScore:
        weightedBrierScore !== null ? new Prisma.Decimal(weightedBrierScore) : null,
      rankingScore: new Prisma.Decimal(rankingScore),
      lastRecomputedAt: new Date(),
    },
    update: {
      resolvedPositions,
      correctPositions,
      weightedBrierScore:
        weightedBrierScore !== null ? new Prisma.Decimal(weightedBrierScore) : null,
      rankingScore: new Prisma.Decimal(rankingScore),
      lastRecomputedAt: new Date(),
    },
  });
}

export async function recomputeAllUserAccuracy(): Promise<AccuracySummary> {
  const summary: AccuracySummary = {
    usersProcessed: 0,
    rowsWritten: 0,
    errors: [],
  };

  // Only users with at least one snapshot need recomputing. Anyone
  // else either never linked a wallet or hasn't resolved any
  // position yet — recomputeUserAccuracy is a no-op for them.
  const users = await prisma.polymarketPositionSnapshot.findMany({
    distinct: ['userId'],
    select: { userId: true },
  });

  for (const u of users) {
    summary.usersProcessed += 1;
    try {
      await recomputeUserAccuracy(u.userId);
      summary.rowsWritten += 1;
    } catch (err) {
      summary.errors.push({
        userId: u.userId.toString(),
        message: (err as Error).message,
      });
    }
  }

  return summary;
}
