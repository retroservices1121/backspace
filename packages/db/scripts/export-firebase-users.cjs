#!/usr/bin/env node
/*
 * One-off: export legacy NewSocial users from Firestore into users.json
 * for the waitlist back-fill (see migrate-waitlist.cjs).
 *
 * The old data model splits a user across two collections, keyed by the
 * same Firebase UID document id:
 *   - `users`         -> the public `username`
 *   - `users_private` -> the `email`
 *
 * This joins them and writes packages/db/scripts/users.json. It is
 * READ-ONLY against Firestore — it never writes back.
 *
 * Usage:
 *   node packages/db/scripts/export-firebase-users.cjs <service-account.json>
 * or set FIREBASE_SERVICE_ACCOUNT to the json path.
 */
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const saPath = process.argv[2] || process.env.FIREBASE_SERVICE_ACCOUNT;
if (!saPath || !fs.existsSync(saPath)) {
  console.error(
    'Usage: node export-firebase-users.cjs <path-to-service-account.json>',
  );
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(path.resolve(saPath))),
});
const db = admin.firestore();

// Firestore Timestamp / string / {_seconds} -> ISO string (or null).
function toIso(v) {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate().toISOString();
  if (typeof v === 'string') return v;
  if (typeof v._seconds === 'number') {
    return new Date(v._seconds * 1000).toISOString();
  }
  return null;
}

async function dumpCollection(name) {
  const out = new Map();
  const snap = await db.collection(name).get();
  snap.forEach((doc) => out.set(doc.id, doc.data()));
  return out;
}

(async () => {
  console.log('Reading `users` and `users_private` from Firestore...');
  const [users, privates] = await Promise.all([
    dumpCollection('users'),
    dumpCollection('users_private'),
  ]);
  console.log(`  users: ${users.size}, users_private: ${privates.size}`);

  const rows = [];
  let noEmail = 0;
  let noUsername = 0;
  for (const [id, u] of users) {
    const priv = privates.get(id);
    const email = priv && priv.email ? String(priv.email) : null;
    const username = u && u.username ? String(u.username) : null;
    if (!email) noEmail += 1;
    if (!username) noUsername += 1;
    rows.push({
      id,
      username,
      email,
      createdAt: toIso(u && u.created_at) || toIso(priv && priv.created_at),
    });
  }

  const outPath = path.join(__dirname, 'users.json');
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2));
  console.log(`Wrote ${rows.length} rows -> ${outPath}`);
  console.log(`  rows missing email: ${noEmail}`);
  console.log(`  rows missing username: ${noUsername}`);
  process.exit(0);
})().catch((err) => {
  console.error('Export failed:', err);
  process.exit(1);
});
