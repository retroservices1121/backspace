#!/usr/bin/env node
/*
 * Backfill: make every existing user follow the official accounts
 * (jp + backspace), matching the auto-follow that new signups get in
 * apps/web/src/pages/api/user/index.ts.
 *
 * Idempotent and re-runnable — uses createMany({ skipDuplicates }) and
 * never self-follows. Re-run this after the `backspace` account
 * finishes onboarding (it has no User row until then, so it is simply
 * skipped on earlier runs).
 *
 * Flags:
 *   --dry-run   Report what would happen; write nothing.
 *
 *   node packages/db/scripts/backfill-auto-follows.cjs --dry-run
 *   node packages/db/scripts/backfill-auto-follows.cjs
 */
const { PrismaClient } = require('@prisma/client');

const DRY_RUN = process.argv.includes('--dry-run');
const AUTO_FOLLOW_USERNAMES = ['jp', 'backspace'];

const prisma = new PrismaClient();

async function main() {
  const official = await prisma.user.findMany({
    where: { username: { in: AUTO_FOLLOW_USERNAMES } },
    select: { id: true, username: true },
  });
  const missing = AUTO_FOLLOW_USERNAMES.filter(
    (u) => !official.some((o) => o.username === u),
  );
  if (missing.length > 0) {
    console.warn(`No User row yet for: ${missing.join(', ')} — skipped.`);
  }
  if (official.length === 0) {
    console.log('No official accounts exist yet. Nothing to do.');
    return;
  }

  const users = await prisma.user.findMany({ select: { id: true } });
  console.log(
    `${users.length} users -> follow [${official.map((o) => o.username).join(', ')}]`,
  );

  const data = [];
  for (const user of users) {
    for (const account of official) {
      if (account.id === user.id) continue; // never self-follow
      data.push({ followerId: user.id, accountId: account.id });
    }
  }

  if (DRY_RUN) {
    console.log(`[dry-run] would upsert ${data.length} follow rows.`);
    return;
  }

  const result = await prisma.follow.createMany({
    data,
    skipDuplicates: true,
  });
  console.log(`Created ${result.count} new follow rows (duplicates skipped).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
