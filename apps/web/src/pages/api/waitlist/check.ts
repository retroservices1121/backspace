// Authenticated username availability check used by the onboarding form.
// Differs from the landing-page check in that the caller's own waitlist
// reservation is treated as "available" — so a user who reserved their
// handle on the landing page can submit it through onboarding without
// hitting their own conflict.
import { getPrivyUserEmailById } from '@backspace/auth';
import {
  REJECTION_COPY,
  type UsernameRejection,
  validateUsernameFormat,
} from '@backspace/usernames';
import prisma from '@src/api2/prisma';
import createHandler from '@src/lib/nextconnect';

const PRIVY_CFG = {
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
};

export type WaitlistCheckResponse =
  | { available: true; normalized: string }
  | {
    available: false;
    reason: UsernameRejection | 'taken' | 'reserved';
    message: string;
  };

const handler = createHandler();

handler.get(async (req, res) => {
  const raw = typeof req.query.u === 'string' ? req.query.u : '';
  const format = validateUsernameFormat(raw);
  if (!format.ok) {
    const body: WaitlistCheckResponse = {
      available: false,
      reason: format.reason,
      message: REJECTION_COPY[format.reason],
    };
    res.json(body);
    return;
  }

  const usernameLower = format.normalized;

  // Resolve the caller's email (best-effort — anonymous callers fall
  // through to the strictest "no own-reservation match" check).
  // req.authId is the verified Privy DID set by the createHandler
  // middleware; resolve the email from it rather than the access token.
  let callerEmail: string | null = null;
  if (req.authId) {
    callerEmail = await getPrivyUserEmailById(req.authId, PRIVY_CFG).catch(() => null);
    if (callerEmail) callerEmail = callerEmail.toLowerCase();
  }

  const [existingUser, existingReservedRow, existingWaitlist] =
    await Promise.all([
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
        select: { email: true, claimedAt: true },
      }),
    ]);

  if (existingUser) {
    const body: WaitlistCheckResponse = {
      available: false,
      reason: 'taken',
      message: 'Already taken.',
    };
    res.json(body);
    return;
  }
  if (existingReservedRow) {
    const body: WaitlistCheckResponse = {
      available: false,
      reason: 'reserved',
      message: 'That one is reserved.',
    };
    res.json(body);
    return;
  }
  if (
    existingWaitlist &&
    existingWaitlist.email !== callerEmail &&
    !existingWaitlist.claimedAt
  ) {
    const body: WaitlistCheckResponse = {
      available: false,
      reason: 'reserved',
      message: 'Someone reserved that one on the waitlist.',
    };
    res.json(body);
    return;
  }

  const body: WaitlistCheckResponse = {
    available: true,
    normalized: usernameLower,
  };
  res.json(body);
});

export default handler;
