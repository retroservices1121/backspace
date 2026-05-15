// One-off transition cleanup: remove orphaned Polymarket negRisk
// sub-markets left behind when the importer switched from /markets
// (one conditionId row per candidate) to /events (one grouped
// `event-` market with the candidates as outcomes).
//
// A POLYMARKET market with a 0x conditionId externalId AND negRisk=true
// is definitionally an orphan now — the /events adapter only ever emits
// negRisk=true on `event-`-prefixed grouped markets, never on a bare
// conditionId. So these rows can no longer be re-imported and just
// clutter the feed as duplicates of the grouped cards.
//
// Safe: Outcome rows cascade-delete with their Market. The script
// aborts before deleting if any Position/Trade still references the
// set, so it can't fail mid-delete.
//
// Run from packages/db:
//   node scripts/cleanup-orphan-negrisk-markets.cjs

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const where = {
    venue: 'POLYMARKET',
    negRisk: true,
    externalId: { startsWith: '0x' },
  };

  const orphans = await prisma.market.findMany({ where, select: { id: true } });
  if (orphans.length === 0) {
    console.log('No orphaned negRisk sub-markets — nothing to do.');
    return;
  }
  const ids = orphans.map((m) => m.id);
  console.log(`Found ${ids.length} orphaned negRisk sub-markets.`);

  const [positions, trades] = await Promise.all([
    prisma.position.count({ where: { marketId: { in: ids } } }),
    prisma.trade.count({ where: { marketId: { in: ids } } }),
  ]);
  if (positions > 0 || trades > 0) {
    console.error(
      `Aborting: ${positions} position(s) and ${trades} trade(s) still `
        + 'reference these markets — resolve those first.',
    );
    process.exitCode = 1;
    return;
  }

  // Outcome rows cascade-delete with their Market (onDelete: Cascade).
  const { count } = await prisma.market.deleteMany({ where });
  console.log(`Deleted ${count} orphaned markets (outcomes cascaded).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
