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
  // The Data API exposes resolved positions with a settledAt /
  // closedAt timestamp + a payout once the market resolves. The
  // exact field name is historically `payout`; on some recent
  // schema versions it's reported as `redemption` or appears on a
  // sibling endpoint. Capture both so the worker tolerates either.
  payout?: number;
  redemption?: number;
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
  // Only resolved rows belong in the snapshot. A position with no
  // settledAt/closedAt is still open and shouldn't count toward
  // accuracy yet.
  return all.filter((p) => Boolean(p.settledAt ?? p.closedAt));
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
      const settledAt = p.settledAt ?? p.closedAt;
      if (!settledAt) continue;
      const payout = p.payout ?? p.redemption ?? 0;
      // Won if the position paid out. A redeemable=true with payout=0
      // means the position lost (it's "redeemable" in the sense the
      // user can claim zero). avgPrice < curPrice doesn't matter
      // here — we want the binary settlement outcome.
      const won = payout > 0;

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
            settledAt: new Date(settledAt),
          },
          update: {
            outcomeLabel: p.outcome,
            avgPrice: new Prisma.Decimal(p.avgPrice),
            size: new Prisma.Decimal(p.size),
            payoutUsd: new Prisma.Decimal(payout),
            realizedPnlUsd: new Prisma.Decimal(p.realizedPnl ?? 0),
            won,
            settledAt: new Date(settledAt),
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
