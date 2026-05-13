import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@backspace/db';
import {
  REJECTION_COPY,
  normalizeUsername,
  validateUsernameFormat,
} from '@backspace/usernames';

import { sendWaitlistConfirmation } from '@src/lib/email';
import { hashIp } from '@src/lib/hashIp';
import prisma from '@src/lib/prisma';
import { checkRateLimit, clientIp } from '@src/lib/rateLimit';
import { newReferralCode } from '@src/lib/referralCode';

type Ok = {
  ok: true;
  referralCode: string;
  alreadyOnList: boolean;
  position: number;
  total: number;
};
type Err = { ok: false; error: string; field?: 'email' | 'username' };

// The four chip values the landing page exposes. Anything else gets
// dropped silently — we don't want a misbehaving client to seed
// arbitrary strings into the segmentation column.
const ALLOWED_INTERESTS: ReadonlySet<string> = new Set([
  'markets',
  'crypto',
  'community',
  'trading',
]);

// Conservative email shape check. We don't try to be RFC-perfect — the
// confirmation email is the real test of whether the address works.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Err>,
) {
  try {
    return await run(req, res);
  } catch (err) {
    // Any uncaught error (notably Prisma failures from a missing
    // DATABASE_URL or unreachable DB) — log it and respond with a
    // structured JSON so the client surfaces "Could not save" instead
    // of falling into the generic "Network error" catch.
    console.error('[waitlist] unhandled error', err);
    return res
      .status(500)
      .json({ ok: false, error: 'Could not save. Try again.' });
  }
}

async function run(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const ip = clientIp(req);
  // 6 submits per IP per hour. Real users only need one; this leaves
  // headroom for genuine retries (typo'd email, etc.) without enabling
  // bulk reservation farming.
  const limit = checkRateLimit(`submit:${ip}`, 6, 600_000);
  if (!limit.allowed) {
    res.setHeader('Retry-After', Math.ceil(limit.retryAfterMs / 1000));
    return res
      .status(429)
      .json({ ok: false, error: 'Too many attempts. Try again later.' });
  }

  const body = req.body as {
    email?: unknown;
    username?: unknown;
    r?: unknown;
    interests?: unknown;
  };
  const emailRaw =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const usernameRaw = typeof body.username === 'string' ? body.username : '';
  const referrerCode =
    typeof body.r === 'string' ? body.r.trim().toUpperCase() : '';
  const interests = Array.isArray(body.interests)
    ? Array.from(
        new Set(
          body.interests
            .filter((x): x is string => typeof x === 'string')
            .map((x) => x.trim().toLowerCase())
            .filter((x) => ALLOWED_INTERESTS.has(x)),
        ),
      )
    : [];

  if (!emailRaw || !EMAIL_REGEX.test(emailRaw) || emailRaw.length > EMAIL_MAX_LENGTH) {
    return res
      .status(400)
      .json({ ok: false, error: 'Enter a valid email.', field: 'email' });
  }

  let usernameLower: string | null = null;
  let usernameDisplay: string | null = null;
  if (usernameRaw) {
    const format = validateUsernameFormat(usernameRaw);
    if (!format.ok) {
      return res.status(400).json({
        ok: false,
        error: REJECTION_COPY[format.reason],
        field: 'username',
      });
    }
    usernameLower = format.normalized;
    usernameDisplay = normalizeUsername(usernameRaw);
  }

  // If the caller already exists in the waitlist, treat this as an
  // update — they may be back to claim a handle they didn't pick the
  // first time. Re-claiming the same handle is a no-op.
  const existing = await prisma.waitlistEntry.findUnique({
    where: { email: emailRaw },
  });
  if (existing?.claimedAt) {
    return res.status(409).json({
      ok: false,
      error: 'That email already has an account on Backspace.',
      field: 'email',
    });
  }

  if (usernameLower) {
    // Block obvious conflicts before we try to insert; the DB unique
    // index is the source of truth but a friendly error here saves a
    // failed roundtrip on the happy path.
    const [userTaken, reservedTaken, waitlistTaken] = await Promise.all([
      prisma.user.findFirst({
        where: { username: { equals: usernameLower, mode: 'insensitive' } },
        select: { id: true },
      }),
      prisma.reservedUser.findFirst({
        where: { username: { equals: usernameLower, mode: 'insensitive' } },
        select: { id: true },
      }),
      prisma.waitlistEntry.findUnique({
        where: { usernameLower },
        select: { email: true },
      }),
    ]);
    if (userTaken) {
      return res.status(409).json({
        ok: false,
        error: 'That username is already taken.',
        field: 'username',
      });
    }
    if (reservedTaken) {
      return res.status(409).json({
        ok: false,
        error: 'That username is reserved.',
        field: 'username',
      });
    }
    if (waitlistTaken && waitlistTaken.email !== emailRaw) {
      return res.status(409).json({
        ok: false,
        error: 'Someone else just claimed that username.',
        field: 'username',
      });
    }
  }

  let referredById: bigint | null = null;
  if (referrerCode) {
    const referrer = await prisma.waitlistEntry.findUnique({
      where: { referralCode: referrerCode },
      select: { id: true },
    });
    if (referrer) referredById = referrer.id;
  }

  // Generate a referral code. Collision odds on an 8-char (28^8 ≈ 3.8e11)
  // alphabet are negligible; one retry is a safety net not a strategy.
  let referralCode = newReferralCode();

  let createdAt: Date;
  try {
    const upserted = await prisma.waitlistEntry.upsert({
      where: { email: emailRaw },
      create: {
        email: emailRaw,
        usernameLower: usernameLower ?? undefined,
        usernameDisplay: usernameDisplay ?? undefined,
        referralCode,
        referredById: referredById ?? undefined,
        ipHash: hashIp(ip),
        interests,
      },
      update: {
        // Only let an existing entry adopt a username if it didn't have
        // one yet — preserves the original reservation if any.
        ...(usernameLower && !existing?.usernameLower
          ? { usernameLower, usernameDisplay }
          : {}),
        // Always merge in interests so a returning visitor can update
        // their picks.
        ...(interests.length > 0 ? { interests } : {}),
      },
      select: { referralCode: true, createdAt: true },
    });
    referralCode = upserted.referralCode;
    createdAt = upserted.createdAt;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      // Race on the username unique index. Retry once with the username
      // dropped so the email still gets registered, then surface the
      // conflict to the user.
      try {
        const fallback = await prisma.waitlistEntry.upsert({
          where: { email: emailRaw },
          create: {
            email: emailRaw,
            referralCode,
            referredById: referredById ?? undefined,
            ipHash: hashIp(ip),
          },
          update: {},
          select: { referralCode: true },
        });
        return res.status(409).json({
          ok: false,
          error: 'Someone else just claimed that username.',
          field: 'username',
        });
      } catch {
        return res
          .status(500)
          .json({ ok: false, error: 'Could not save. Try again.' });
      }
    }
    console.error('waitlist upsert failed', err);
    return res
      .status(500)
      .json({ ok: false, error: 'Could not save. Try again.' });
  }

  // Position = (rows older than this one) + 1. Total = all rows.
  // Running them in a transaction keeps the two numbers consistent.
  const [olderCount, total] = await prisma.$transaction([
    prisma.waitlistEntry.count({
      where: { createdAt: { lt: createdAt } },
    }),
    prisma.waitlistEntry.count(),
  ]);
  const position = olderCount + 1;

  // First-time signups get a confirmation email. Fire-and-forget so a
  // Resend hiccup never blocks the success state. Returning users who
  // re-submit (existing row) don't get re-emailed — avoids accidentally
  // training people to expect a fresh email per visit.
  if (!existing) {
    const fwdHost = req.headers['x-forwarded-host'];
    const host =
      (typeof fwdHost === 'string' ? fwdHost : Array.isArray(fwdHost) ? fwdHost[0] : null) ??
      req.headers.host ??
      'backspacethat.com';
    void sendWaitlistConfirmation({
      to: emailRaw,
      handle: usernameDisplay ?? usernameLower ?? null,
      position,
      total,
      referralCode,
      origin: host,
    });
  }

  return res.status(200).json({
    ok: true,
    referralCode,
    alreadyOnList: Boolean(existing),
    position,
    total,
  });
}
