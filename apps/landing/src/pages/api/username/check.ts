import type { NextApiRequest, NextApiResponse } from 'next';
import {
  REJECTION_COPY,
  type UsernameRejection,
  validateUsernameFormat,
} from '@backspace/usernames';

import prisma from '@src/lib/prisma';
import { checkRateLimit, clientIp } from '@src/lib/rateLimit';

type Available = { available: true; normalized: string };
type Unavailable = {
  available: false;
  reason: UsernameRejection | 'taken' | 'reserved' | 'rate_limited';
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Available | Unavailable | { error: string }>,
) {
  try {
    return await run(req, res);
  } catch (err) {
    // Catch-all so a Prisma failure (missing DATABASE_URL, unreachable
    // DB, etc.) returns structured JSON rather than Next's default 500
    // HTML page — the client falls back to "unknown" on this status
    // and still lets the user submit.
    console.error('[username/check] unhandled error', err);
    return res.status(500).json({ error: 'Check failed.' });
  }
}

async function run(
  req: NextApiRequest,
  res: NextApiResponse<Available | Unavailable | { error: string }>,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 60 checks per IP per minute. The form debounces, so a real user
  // submits ~one check per ~300ms keystroke cluster.
  const ip = clientIp(req);
  const limit = checkRateLimit(`check:${ip}`, 60, 1_000);
  if (!limit.allowed) {
    res.setHeader('Retry-After', Math.ceil(limit.retryAfterMs / 1000));
    return res.status(429).json({
      available: false,
      reason: 'rate_limited',
      message: 'Slow down a bit.',
    });
  }

  const rawInput =
    typeof req.query.u === 'string'
      ? req.query.u
      : Array.isArray(req.query.u)
      ? req.query.u[0] ?? ''
      : '';

  const format = validateUsernameFormat(rawInput);
  if (!format.ok) {
    return res.status(200).json({
      available: false,
      reason: format.reason,
      message: REJECTION_COPY[format.reason],
    });
  }

  const usernameLower = format.normalized;

  const [existingUser, existingReservation, existingReservedRow] =
    await Promise.all([
      prisma.user.findFirst({
        where: { username: { equals: usernameLower, mode: 'insensitive' } },
        select: { id: true },
      }),
      prisma.waitlistEntry.findUnique({
        where: { usernameLower },
        select: { id: true, claimedAt: true },
      }),
      prisma.reservedUser.findFirst({
        where: { username: { equals: usernameLower, mode: 'insensitive' } },
        select: { id: true },
      }),
    ]);

  if (existingUser) {
    return res
      .status(200)
      .json({ available: false, reason: 'taken', message: 'Already taken.' });
  }
  if (existingReservation || existingReservedRow) {
    return res.status(200).json({
      available: false,
      reason: 'reserved',
      message: 'Someone else got it first.',
    });
  }

  return res.status(200).json({ available: true, normalized: usernameLower });
}
