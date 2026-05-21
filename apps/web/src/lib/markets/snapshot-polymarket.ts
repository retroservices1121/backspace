// Polymarket position snapshot worker.
//
// Walks every Wallet row tagged source='linked-polymarket' (i.e. the
// external EOAs users have attached via /settings/wallet), plus their
// derived Safes, and persists resolved positions from Polymarket's
// Data API into PolymarketPositionSnapshot. Phase 10.4's accuracy
// aggregator reads from that table — running this snapshot keeps the
// aggregation off the request path and bounds the Data API call
// volume to once per cron tick instead of once per profile view.
//
// Source of truth: Polymarket. Settled/payout/realizedPnl are
// authoritative on their side; we cache the answer.
//
// Idempotency: PolymarketPositionSnapshot is unique on
// (safeAddress, conditionId, outcomeAssetId) so re-runs upsert.

import prisma from '@src/api2/prisma';
import { Prisma } from '@prisma/client';

import { DATA_API_URL } from '@src/lib/polymarket/config';

export type SnapshotSummary = {
  walletsScanned: number;
  rowsUpserted: number;
  errors: Array<{ safeAddress: string; message: string }>;
};

type DataApiPosition = {
  asset: string;
  conditionId: string;
  outcome: string;
  size: number;
  avgPrice: number;
  realizedPnl: number;
  redeemable: boolean;
  // Binary outcome prices settle to 0 (lost) or 1 (won) at resolution.
  // While the market is open this is the live mid-market price.
  curPrice?: number;
  currentValue?: number;
  // Polymarket's `/positions` endpoint does not expose settledAt /
  // closedAt at all in practice — the resolution signal is
  // `redeemable: true` combined with `endDate` in the past (and the
  // settlement value lives in `curPrice`, which collapses to 0 or 1).
  // We keep the optional settledAt/closedAt for forward-compat in
  // case a future schema version surfaces them.
  endDate?: string;
  settledAt?: string;
  closedAt?: string;
};

async function fetchResolvedPositions(safeAddress: string): Promise<DataApiPosition[]> {
  // Data API: filter to resolved positions to keep the payload small.
  // The redeemable=true filter alone misses positions the user has
  // already claimed; combine it with sizeThreshold=0 to include the
  // full history.
  const url = `${DATA_API_URL}/positions?user=${safeAddress}&sizeThreshold=0`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Polymarket Data API HTTP ${res.status} for ${safeAddress}`);
  }
  const all = (await res.json()) as DataApiPosition[];
  // A position is "resolved" when the underlying market has ended.
  // The Data API surfaces this as `endDate` in the past + the
  // position being `redeemable` (winners awaiting claim, or losers
  // permanently stuck at curPrice=0). settledAt/closedAt are kept
  // as forward-compat — current schema doesn't populate them.
  const now = Date.now();
  return all.filter((p) => {
    if (p.settledAt || p.closedAt) return true;
    if (!p.endDate) return false;
    const ended = new Date(p.endDate).getTime();
    if (Number.isNaN(ended) || ended >= now) return false;
    return p.redeemable === true;
  });
}

export async function snapshotPolymarketPositions(): Promise<SnapshotSummary> {
  const summary: SnapshotSummary = {
    walletsScanned: 0,
    rowsUpserted: 0,
    errors: [],
  };

  const wallets = await prisma.wallet.findMany({
    where: {
      source: 'linked-polymarket',
      safeAddress: { not: null },
    },
    select: { userId: true, safeAddress: true },
  });

  for (const w of wallets) {
    const safeAddress = w.safeAddress as string;
    summary.walletsScanned += 1;

    let positions: DataApiPosition[];
    try {
      positions = await fetchResolvedPositions(safeAddress);
    } catch (err) {
      summary.errors.push({ safeAddress, message: (err as Error).message });
      continue;
    }

    for (const p of positions) {
      const settledAtIso = p.settledAt ?? p.closedAt ?? p.endDate;
      if (!settledAtIso) continue;
      // Binary outcomes settle to 0 or 1 in `curPrice`. >= 0.5 covers
      // any future fractional settlement (multi-outcome markets) and
      // is robust against tiny float drift.
      const curPrice = p.curPrice ?? 0;
      const won = curPrice >= 0.5;
      // Expected payout: shares × settled price. Equals size for a
      // winner, 0 for a loser. We don't have an authoritative
      // realized-payout field on /positions — that lives in the
      // activity endpoint — but the expected payout from the binary
      // settlement is the accuracy-relevant quantity.
      const payout = p.size * curPrice;

      try {
        await prisma.polymarketPositionSnapshot.upsert({
          where: {
            snapshotIdentity: {
              safeAddress,
              conditionId: p.conditionId,
              outcomeAssetId: p.asset,
            },
          },
          create: {
            userId: w.userId,
            safeAddress,
            conditionId: p.conditionId,
            outcomeAssetId: p.asset,
            outcomeLabel: p.outcome,
            avgPrice: new Prisma.Decimal(p.avgPrice),
            size: new Prisma.Decimal(p.size),
            payoutUsd: new Prisma.Decimal(payout),
            realizedPnlUsd: new Prisma.Decimal(p.realizedPnl ?? 0),
            won,
            settledAt: new Date(settledAtIso),
          },
          update: {
            outcomeLabel: p.outcome,
            avgPrice: new Prisma.Decimal(p.avgPrice),
            size: new Prisma.Decimal(p.size),
            payoutUsd: new Prisma.Decimal(payout),
            realizedPnlUsd: new Prisma.Decimal(p.realizedPnl ?? 0),
            won,
            settledAt: new Date(settledAtIso),
          },
        });
        summary.rowsUpserted += 1;
      } catch (err) {
        summary.errors.push({
          safeAddress: `${safeAddress}:${p.conditionId}:${p.asset}`,
          message: (err as Error).message,
        });
      }
    }
  }

  return summary;
}
