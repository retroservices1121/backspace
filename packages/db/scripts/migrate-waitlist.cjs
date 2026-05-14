#!/usr/bin/env node
/*
 * One-off: back-fill WaitlistEntry with legacy NewSocial users exported
 * by export-firebase-users.cjs.
 *
 * Rules:
 *   - Skip a row whose email is already in WaitlistEntry (or empty /
 *     malformed, or a duplicate within the export file itself).
 *   - Skip a row whose normalized username is already taken in User,
 *     ReservedUser, or WaitlistEntry. (Per the instruction: "if the
 *     name is already in our database it gets skipped.")
 *   - If the username is missing or fails the format/length rules,
 *     still insert an email-only WaitlistEntry — it counts toward the
 *     total, we just don't reserve a handle for it.
 *
 * Flags:
 *   --dry-run    Report what would happen; write nothing.
 *   --backdate   Use each user's original Firestore created_at as the
 *                WaitlistEntry.createdAt (affects position ordering).
 *                Default: all migrated rows get the run timestamp.
 *
 *   node packages/db/scripts/migrate-waitlist.cjs --dry-run
 *   node packages/db/scripts/migrate-waitlist.cjs
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const DRY_RUN = process.argv.includes('--dry-run');
const BACKDATE = process.argv.includes('--backdate');
const prisma = new PrismaClient();

// Mirrors @backspace/usernames: format + length. The reserved /
// trademark blocklist is intentionally NOT applied — a legacy user who
// registered a blocklisted handle still counts toward the total; they
// just get stored email-only (usernameLower stays null) rather than
// having that handle reserved for them.
const USERNAME_REGEX = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
function normalizeUsername(s) {
  return String(s).trim().toLowerCase();
}
function validUsername(raw) {
  if (!raw) return null;
  const n = normalizeUsername(raw);
  if (n.length < USERNAME_MIN || n.length > USERNAME_MAX) return null;
  if (!USERNAME_REGEX.test(n)) return null;
  return n;
}

// Same alphabet as apps/landing newReferralCode (nanoid customAlphabet),
// minus ambiguous glyphs. crypto.randomInt keeps it unbiased.
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
function newReferralCode() {
  let c = '';
  for (let i = 0; i < 8; i += 1) {
    c += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  }
  return c;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX = 254;

(async () => {
  const inPath = path.join(__dirname, 'users.json');
  if (!fs.existsSync(inPath)) {
    console.error(
      'users.json not found — run export-firebase-users.cjs first.',
    );
    process.exit(1);
  }
  const rows = JSON.parse(fs.readFileSync(inPath, 'utf8'));
  console.log(
    `Loaded ${rows.length} legacy users.  mode: ${
      DRY_RUN ? 'DRY RUN' : 'LIVE'
    }${BACKDATE ? ' (backdate)' : ''}`,
  );

  // Pre-load existing keys: one pass each instead of 3 queries per row.
  const [existingUsers, existingReserved, existingWaitlist] =
    await Promise.all([
      prisma.user.findMany({ select: { username: true } }),
      prisma.reservedUser.findMany({ select: { username: true } }),
      prisma.waitlistEntry.findMany({
        select: { email: true, usernameLower: true },
      }),
    ]);
  const takenUsernames = new Set();
  for (const u of existingUsers) takenUsernames.add(u.username.toLowerCase());
  for (const r of existingReserved) {
    takenUsernames.add(r.username.toLowerCase());
  }
  for (const w of existingWaitlist) {
    if (w.usernameLower) takenUsernames.add(w.usernameLower);
  }
  const takenEmails = new Set(
    existingWaitlist.map((w) => w.email.toLowerCase()),
  );

  const stats = {
    migratedWithHandle: 0,
    migratedEmailOnly: 0,
    skipEmailMissing: 0,
    skipEmailInvalid: 0,
    skipEmailDuplicate: 0,
    skipUsernameTaken: 0,
    insertError: 0,
  };
  // Guard against duplicate emails / usernames within the export file.
  const seenEmails = new Set();
  const seenUsernames = new Set();

  for (const row of rows) {
    const email = row.email ? String(row.email).trim().toLowerCase() : '';
    if (!email) {
      stats.skipEmailMissing += 1;
      continue;
    }
    if (!EMAIL_REGEX.test(email) || email.length > EMAIL_MAX) {
      stats.skipEmailInvalid += 1;
      continue;
    }
    if (takenEmails.has(email) || seenEmails.has(email)) {
      stats.skipEmailDuplicate += 1;
      continue;
    }

    const uname = validUsername(row.username);
    // Username collision -> skip the whole row.
    if (uname && (takenUsernames.has(uname) || seenUsernames.has(uname))) {
      stats.skipUsernameTaken += 1;
      continue;
    }

    let createdAt = new Date();
    if (BACKDATE && row.createdAt) {
      const d = new Date(row.createdAt);
      if (!Number.isNaN(d.getTime())) createdAt = d;
    }

    const data = {
      email,
      usernameLower: uname || undefined,
      usernameDisplay: uname ? String(row.username).trim() : undefined,
      referralCode: newReferralCode(),
      createdAt,
    };

    if (!DRY_RUN) {
      try {
        await prisma.waitlistEntry.create({ data });
      } catch (e) {
        stats.insertError += 1;
        console.warn(`  insert failed for ${email}: ${e.code || e.message}`);
        continue;
      }
    }

    seenEmails.add(email);
    if (uname) {
      seenUsernames.add(uname);
      stats.migratedWithHandle += 1;
    } else {
      stats.migratedEmailOnly += 1;
    }
  }

  console.log('\nResult:');
  for (const [k, v] of Object.entries(stats)) {
    console.log(`  ${k}: ${v}`);
  }
  const total = await prisma.waitlistEntry.count();
  console.log(
    `\nWaitlistEntry total: ${total}${
      DRY_RUN ? ' (unchanged — dry run)' : ''
    }`,
  );
  await prisma.$disconnect();
})().catch(async (err) => {
  console.error('Migration failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
