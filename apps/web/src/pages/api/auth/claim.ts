// Claim-your-account flow.
//
// Legacy Firebase-Auth users have a row in Postgres (seeded by the
// migration scripts under apps/web/src/migration/) whose `User.authId`
// column holds their old Firebase UID and whose `Private.email` holds
// their email. When such a user signs back in via Privy with the same
// email, this endpoint atomically rewrites their `User.authId` to the
// new Privy DID, parks the old UID in `User.legacyAuthId` for forensics,
// and writes an audit row.
//
// The endpoint is idempotent: repeat calls after a successful claim
// short-circuit at the "already exists" check.
//
// Identity always comes from the verified Privy token in the request
// (see lib/nextconnect.ts) — the body is empty. The email used for
// matching comes from Privy server-side, never from the client, so a
// caller cannot impersonate someone else's email.

import { Prisma } from '@prisma/client';
import { getPrivyUserEmailById } from '@backspace/auth';
import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

const PRIVY_CFG = {
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
};

export type ClaimResponse =
  | { claimed: false; alreadyExists: true; userId: string }
  | { claimed: false; reason: 'no_email' }
  | { claimed: false; reason: 'no_match' }
  | { claimed: false; reason: 'ambiguous_match'; count: number }
  | { claimed: true; userId: string; legacyAuthId: string };

const handler = createHandler();

handler.use(requireAuthMiddleware).post(async (req, res) => {
  const privyDid = req.authId;

  // Already on the new auth identifier — nothing to do.
  const existing = await prisma.user.findUnique({ where: { authId: privyDid } });
  if (existing) {
    const body: ClaimResponse = {
      claimed: false,
      alreadyExists: true,
      userId: existing.id.toString(),
    };
    res.json(body);
    return;
  }

  // privyDid (= req.authId) is the verified DID from requireAuthMiddleware.
  // Resolve the email from it server-side; the access token is not an
  // identity token and cannot be passed to the getUser({ idToken }) path.
  const email = await getPrivyUserEmailById(privyDid, PRIVY_CFG).catch((err) => {
    console.error('Privy getUser failed during claim', err);
    return null;
  });
  if (!email) {
    const body: ClaimResponse = { claimed: false, reason: 'no_email' };
    res.json(body);
    return;
  }

  // Find legacy candidates: matching email on Private, and an authId that
  // is NOT already a Privy DID. `take: 2` lets us detect ambiguity without
  // pulling the entire colliding set.
  const matches = await prisma.user.findMany({
    where: {
      private: { is: { email: { equals: email, mode: 'insensitive' } } },
      NOT: { authId: { startsWith: 'did:privy:' } },
    },
    take: 2,
  });

  if (matches.length === 0) {
    const body: ClaimResponse = { claimed: false, reason: 'no_match' };
    res.json(body);
    return;
  }
  if (matches.length > 1) {
    const body: ClaimResponse = {
      claimed: false,
      reason: 'ambiguous_match',
      count: matches.length,
    };
    res.status(409).json(body);
    return;
  }

  const legacy = matches[0];

  // Atomic rewrite: User.authId swap + audit row in a single transaction.
  // The unique constraint on User.authId guarantees a concurrent claim of
  // the same row by a second Privy session loses (Prisma surfaces it as
  // P2002 and the transaction rolls back).
  const ipAddress = (req.headers['x-forwarded-for'] as string) ?? null;
  const userAgent = (req.headers['user-agent'] as string) ?? null;
  const auditPayload: Prisma.InputJsonValue = {
    legacyAuthId: legacy.authId,
    privyDid,
    matchedOn: 'email',
  };

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: legacy.id },
      data: {
        legacyAuthId: legacy.authId,
        authId: privyDid,
      },
    });
    await tx.auditLog.create({
      data: {
        actor: { connect: { id: u.id } },
        action: 'user.claim_account',
        target: { connect: { id: u.id } },
        payload: auditPayload,
        ipAddress,
        userAgent,
      },
    });
    return u;
  });

  const body: ClaimResponse = {
    claimed: true,
    userId: updated.id.toString(),
    legacyAuthId: updated.legacyAuthId!,
  };
  res.json(body);
});

export default handler;
