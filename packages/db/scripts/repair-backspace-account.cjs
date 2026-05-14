#!/usr/bin/env node
/*
 * One-off: repair the half-onboarded `backspace` account.
 *
 * The onboarding flow crashed after creating the User row but before
 * the Private / UserState rows (it read .year off a null Date of
 * Birth). This backfills the two missing satellite rows so the
 * account is fully onboarded. Idempotent — uses upsert.
 *
 *   node packages/db/scripts/repair-backspace-account.cjs
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const USERNAME = 'backspace';
const EMAIL = 'backspace@backspacethat.com';

async function main() {
  const user = await prisma.user.findFirst({
    where: { username: USERNAME },
    select: { id: true, name: true },
  });
  if (!user) {
    console.error(`No User row with username "${USERNAME}".`);
    process.exit(1);
  }

  const [firstName, ...rest] = (user.name || 'Backspace Support').split(' ');
  const lastName = rest.join(' ') || 'Support';

  const priv = await prisma.private.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      user: { connect: { id: user.id } },
      email: EMAIL,
      firstName,
      lastName,
    },
  });
  const state = await prisma.userState.upsert({
    where: { userId: user.id },
    update: { onboarded: true },
    create: { user: { connect: { id: user.id } }, onboarded: true },
  });

  console.log(`Repaired user ${user.id} (${USERNAME}):`);
  console.log(`  Private  -> email=${priv.email}, name=${priv.firstName} ${priv.lastName}`);
  console.log(`  UserState-> onboarded=${state.onboarded}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
