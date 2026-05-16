#!/usr/bin/env node
/* Repair a Backspace User row whose Privy DID was orphaned because the
 * Privy user was deleted from the dashboard. Re-logging in with the
 * same email creates a NEW DID; the claim flow (api/auth/claim.ts)
 * refuses to repoint rows that already have a `did:privy:` authId
 * (it's only built for legacy Firebase→Privy claims). So we do it
 * manually here.
 *
 * Usage:
 *   # Auto-discover the new DID via Privy email lookup (works for
 *   # email-OTP signups). Defaults to a dry-run; pass --apply to write.
 *   node packages/db/scripts/repair-privy-did.cjs <username>
 *   node packages/db/scripts/repair-privy-did.cjs <username> --apply
 *
 *   # Explicit DID (use when the user logs in with OAuth-Google etc.,
 *   # since getUserByEmail only matches the dedicated email-link
 *   # account, not the email on a Google login). Copy the new DID
 *   # from the Privy dashboard.
 *   node packages/db/scripts/repair-privy-did.cjs <username> did:privy:abc123 --apply
 *
 * On Railway:
 *   railway run --service web node packages/db/scripts/repair-privy-did.cjs jp --apply
 *
 * Idempotent: if the row's authId already matches the target DID,
 * prints "already correct" and exits 0.
 */
const { PrismaClient } = require('@prisma/client');
const { PrivyClient } = require('@privy-io/server-auth');

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const positional = args.filter((a) => !a.startsWith('--'));
const username = positional[0];
const explicitDid = positional[1];

if (!username) {
  console.error('usage: repair-privy-did.cjs <username> [did:privy:...] [--apply]');
  process.exit(2);
}

const PRIVY_APP_ID = process.env.PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
  console.error('PRIVY_APP_ID / PRIVY_APP_SECRET env vars are required');
  process.exit(2);
}

const prisma = new PrismaClient();
const privy = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

(async () => {
  const user = await prisma.user.findFirst({
    where: { username: { equals: username, mode: 'insensitive' } },
    include: { private: { select: { email: true } } },
  });
  if (!user) {
    console.error(`No User row with username='${username}'`);
    process.exit(1);
  }
  console.log(`Found User row: id=${user.id} username=${user.username} authId=${user.authId}`);
  const email = user.private?.email;
  if (!email) {
    console.error(`User '${username}' has no Private.email — cannot look up new Privy DID by email`);
    process.exit(1);
  }
  console.log(`Email on record: ${email}`);

  let newDid = explicitDid;
  if (!newDid) {
    // getUserByEmail only matches the dedicated email-link account
    // (email-OTP signups). It will NOT match the email of an OAuth
    // Google/Apple login — for those, paste the DID from the Privy
    // dashboard as the second arg.
    let privyUser = null;
    try {
      privyUser = await privy.getUserByEmail(email);
    } catch (err) {
      console.warn(`getUserByEmail failed: ${err.message}`);
    }
    if (!privyUser) {
      console.error(
        `No Privy user found via email-OTP lookup for ${email}.\n`
        + 'If you logged in via Google/Apple/etc., copy the new DID from the Privy dashboard\n'
        + `(Users → search ${email}) and pass it as the second arg:\n`
        + `  node packages/db/scripts/repair-privy-did.cjs ${username} did:privy:... --apply`,
      );
      process.exit(1);
    }
    newDid = privyUser.id;
    console.log(`Current Privy DID for ${email}: ${newDid}`);
  } else {
    console.log(`Using explicit DID: ${newDid}`);
  }

  if (user.authId === newDid) {
    console.log('authId already matches the live Privy DID — nothing to repair. Exiting.');
    await prisma.$disconnect();
    return;
  }

  // Before rewriting, make sure the new DID isn't already attached to
  // some OTHER User row that got created in the limbo state. If it is,
  // refuse and let a human decide which row wins (don't auto-delete).
  const collider = await prisma.user.findUnique({ where: { authId: newDid } });
  if (collider && collider.id !== user.id) {
    console.error(
      `Refusing to repair: new DID ${newDid} is already attached to User id=${collider.id} username=${collider.username}.\n`
      + 'Delete or rename that shell row first, then re-run.',
    );
    process.exit(1);
  }

  const oldDid = user.authId;
  console.log(`Plan: ${oldDid}  →  ${newDid}`);

  if (!apply) {
    console.log('(dry-run — re-run with --apply to write)');
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        legacyAuthId: oldDid,
        authId: newDid,
      },
    });
    await tx.auditLog.create({
      data: {
        actor: { connect: { id: user.id } },
        action: 'user.repair_privy_did',
        target: { connect: { id: user.id } },
        payload: { oldDid, newDid, reason: 'privy_user_deleted_from_dashboard' },
      },
    });
  });

  const after = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, username: true, authId: true, legacyAuthId: true },
  });
  console.log('Done. Row after repair:');
  console.log(JSON.stringify(after, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 2));

  await prisma.$disconnect();
})().catch(async (err) => {
  console.error('repair failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
