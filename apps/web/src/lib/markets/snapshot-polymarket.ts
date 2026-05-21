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
// Two data sources, unioned with /activity winning on overlap:
//
//   /positions  — current outcome-token holdings. Surfaces resolved
//                 positions that the user has NOT redeemed yet (most
//                 commonly losers stuck at curPrice=0 that aren't
//                 worth claim gas).
//   /activity   — historical event feed. Once the user redeems a
//                 winning position the tokens are burned, the row
//                 leaves /positions entirely, and the only surviving
//                 record is the REDEEM event here. Without this source
//                 we systematically miss every claimed winner and the
//                 accuracy badge biases toward 0%.
//
// Source of truth: Polymarket. Settled/payout/realizedPnl are
// authoritative on their side; we cache the answer.
//
// Idempotency: PolymarketPositionSnapshot is unique on
// (safeAddress, conditionId, outcomeAssetId) so re-runs upsert.

import { Prisma } from '@prisma/client';

import prisma from '@src/api2/prisma';
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

// Single event row from the Data API's `/activity` feed. Both trades
// and post-resolution redemptions show up here; we use both — trades
// to reconstruct the user's entry price, redemptions to mark the
// market as settled and capture the realized payout.
type ActivityEvent = {
  proxyWallet: string;
  timestamp: number; // unix seconds
  conditionId: string;
  type: 'TRADE' | 'REDEEM' | string;
  size: number;
  usdcSize: number;
  price?: number;
  asset?: string;
  side?: 'BUY' | 'SELL';
  outcome?: string;
  outcomeIndex?: number;
  transactionHash?: string;
};

// Internal shape — what we feed into the snapshot upsert regardless of
// which data source produced it.
type DerivedSnapshot = {
  conditionId: string;
  outcomeAssetId: string;
  outcomeLabel: string;
  avgPrice: number;
  size: number;
  payoutUsd: number;
  realizedPnlUsd: number;
  won: boolean;
  settledAt: Date;
};

const ACTIVITY_PAGE_LIMIT = 500;

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

async function fetchActivity(safeAddress: string): Promise<ActivityEvent[]> {
  // /activity is paginated by `offset`. Most users will fit in one
  // page; we keep walking until a short page comes back so power
  // users with hundreds of trades don't get truncated.
  const all: ActivityEvent[] = [];
  let offset = 0;
  // Hard cap so a runaway response can't pin the worker forever.
  // 20 pages × 500 = 10k events covers virtually every real user.
  for (let page = 0; page < 20; page += 1) {
    const url = `${DATA_API_URL}/activity?user=${safeAddress}&limit=${ACTIVITY_PAGE_LIMIT}&offset=${offset}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      throw new Error(`Polymarket Data API HTTP ${res.status} on /activity for ${safeAddress}`);
    }
    const batch = (await res.json()) as ActivityEvent[];
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < ACTIVITY_PAGE_LIMIT) break;
    offset += ACTIVITY_PAGE_LIMIT;
  }
  return all;
}

function snapshotsFromActivity(events: ActivityEvent[]): DerivedSnapshot[] {
  // Bucket every event by its conditionId. A market with no REDEEM
  // event isn't resolved-and-claimed yet from this user's side; skip
  // those entirely — the /positions path will catch them if they're
  // genuinely settled.
  const byCondition = new Map<string, ActivityEvent[]>();
  for (const ev of events) {
    if (!ev.conditionId) continue;
    if (!byCondition.has(ev.conditionId)) byCondition.set(ev.conditionId, []);
    byCondition.get(ev.conditionId)!.push(ev);
  }

  const out: DerivedSnapshot[] = [];
  for (const [conditionId, group] of byCondition) {
    const redeems = group.filter((e) => e.type === 'REDEEM');
    if (redeems.length === 0) continue;

    // Aggregate redeem totals — a single market can have multiple
    // partial redemptions if the user claimed in tranches.
    let totalRedeemSize = 0;
    let totalRedeemUsdc = 0;
    let latestRedeemTs = 0;
    for (const r of redeems) {
      totalRedeemSize += r.size;
      totalRedeemUsdc += r.usdcSize;
      if (r.timestamp > latestRedeemTs) latestRedeemTs = r.timestamp;
    }

    // Reconstruct net holdings per outcome (asset) from TRADE events
    // to identify which side the user held at resolution. The REDEEM
    // event itself uses asset='' / outcomeIndex=999 — it doesn't tell
    // us which outcome won, only that something was claimed.
    type AssetAgg = {
      asset: string;
      outcome: string;
      boughtSize: number;
      boughtUsdc: number;
      soldSize: number;
    };
    const byAsset = new Map<string, AssetAgg>();
    for (const ev of group) {
      if (ev.type !== 'TRADE' || !ev.asset) continue;
      if (!byAsset.has(ev.asset)) {
        byAsset.set(ev.asset, {
          asset: ev.asset,
          outcome: ev.outcome ?? '',
          boughtSize: 0,
          boughtUsdc: 0,
          soldSize: 0,
        });
      }
      const row = byAsset.get(ev.asset)!;
      if (ev.side === 'BUY') {
        row.boughtSize += ev.size;
        row.boughtUsdc += ev.usdcSize;
      } else if (ev.side === 'SELL') {
        row.soldSize += ev.size;
      }
    }

    // "Outcome of record" = whichever asset has the largest net buy
    // exposure at resolution. For binary markets where the user only
    // bought one side, this is trivial. For markets where they briefly
    // held both sides, we attribute the position to the side with the
    // larger net stake — close enough for accuracy purposes; the
    // leftover loser shares are noise that get burned with the redeem.
    let chosen: AssetAgg | null = null;
    let bestNet = 0;
    for (const row of byAsset.values()) {
      const net = row.boughtSize - row.soldSize;
      if (net > bestNet) {
        bestNet = net;
        chosen = row;
      }
    }
    if (!chosen || chosen.boughtSize <= 0) continue;

    const avgPrice = chosen.boughtUsdc / chosen.boughtSize;
    const won = totalRedeemUsdc > 0;
    // Realized P&L attributed to the redeemed (winning) tranche:
    // payout minus the cost basis of the shares that actually paid out.
    const realizedPnl = totalRedeemUsdc - avgPrice * totalRedeemSize;

    out.push({
      conditionId,
      outcomeAssetId: chosen.asset,
      outcomeLabel: chosen.outcome,
      avgPrice,
      size: totalRedeemSize,
      payoutUsd: totalRedeemUsdc,
      realizedPnlUsd: realizedPnl,
      won,
      settledAt: new Date(latestRedeemTs * 1000),
    });
  }
  return out;
}

function snapshotFromPosition(p: DataApiPosition): DerivedSnapshot | null {
  const settledAtIso = p.settledAt ?? p.closedAt ?? p.endDate;
  if (!settledAtIso) return null;
  // Binary outcomes settle to 0 or 1 in `curPrice`. >= 0.5 covers
  // any future fractional settlement (multi-outcome markets) and
  // is robust against tiny float drift.
  const curPrice = p.curPrice ?? 0;
  const won = curPrice >= 0.5;
  // Expected payout: shares × settled price. Equals size for a
  // winner, 0 for a loser. /positions doesn't carry a realized
  // payout field — that's the whole reason the /activity path
  // exists — so this is the best we can do for unredeemed rows.
  const payout = p.size * curPrice;
  return {
    conditionId: p.conditionId,
    outcomeAssetId: p.asset,
    outcomeLabel: p.outcome,
    avgPrice: p.avgPrice,
    size: p.size,
    payoutUsd: payout,
    realizedPnlUsd: p.realizedPnl ?? 0,
    won,
    settledAt: new Date(settledAtIso),
  };
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

    // Pull both data sources in parallel — they're independent.
    const [positionsResult, activityResult] = await Promise.allSettled([
      fetchResolvedPositions(safeAddress),
      fetchActivity(safeAddress),
    ]);

    if (positionsResult.status === 'rejected') {
      summary.errors.push({
        safeAddress: `${safeAddress}:positions`,
        message: (positionsResult.reason as Error).message,
      });
    }
    if (activityResult.status === 'rejected') {
      summary.errors.push({
        safeAddress: `${safeAddress}:activity`,
        message: (activityResult.reason as Error).message,
      });
    }

    const fromActivity = activityResult.status === 'fulfilled'
      ? snapshotsFromActivity(activityResult.value)
      : [];
    const fromPositions = positionsResult.status === 'fulfilled'
      ? positionsResult.value.map(snapshotFromPosition).filter((s): s is DerivedSnapshot => s !== null)
      : [];

    // Activity wins on overlap: once a market is redeemed, the
    // /activity record is the canonical post-resolution truth. The
    // /positions row (if any) is stale leftover loser shares.
    const activityConditions = new Set(fromActivity.map((s) => s.conditionId));
    const positionsFiltered = fromPositions.filter((s) => !activityConditions.has(s.conditionId));
    const merged = [...fromActivity, ...positionsFiltered];

    for (const s of merged) {
      try {
        await prisma.polymarketPositionSnapshot.upsert({
          where: {
            snapshotIdentity: {
              safeAddress,
              conditionId: s.conditionId,
              outcomeAssetId: s.outcomeAssetId,
            },
          },
          create: {
            userId: w.userId,
            safeAddress,
            conditionId: s.conditionId,
            outcomeAssetId: s.outcomeAssetId,
            outcomeLabel: s.outcomeLabel,
            avgPrice: new Prisma.Decimal(s.avgPrice),
            size: new Prisma.Decimal(s.size),
            payoutUsd: new Prisma.Decimal(s.payoutUsd),
            realizedPnlUsd: new Prisma.Decimal(s.realizedPnlUsd),
            won: s.won,
            settledAt: s.settledAt,
          },
          update: {
            outcomeLabel: s.outcomeLabel,
            avgPrice: new Prisma.Decimal(s.avgPrice),
            size: new Prisma.Decimal(s.size),
            payoutUsd: new Prisma.Decimal(s.payoutUsd),
            realizedPnlUsd: new Prisma.Decimal(s.realizedPnlUsd),
            won: s.won,
            settledAt: s.settledAt,
          },
        });
        summary.rowsUpserted += 1;
      } catch (err) {
        summary.errors.push({
          safeAddress: `${safeAddress}:${s.conditionId}:${s.outcomeAssetId}`,
          message: (err as Error).message,
        });
      }
    }
  }

  return summary;
}
