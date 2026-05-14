// Returns the caller's waitlist row, if any. Email comes from the
// Privy access token server-side — never the client — so a logged-in
// user cannot read another email's reservation.
import { getPrivyUserEmailById } from '@backspace/auth';
import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

const PRIVY_CFG = {
  appId: process.env.PRIVY_APP_ID!,
  appSecret: process.env.PRIVY_APP_SECRET!,
};

export type WaitlistMeResponse =
  | { found: false }
  | {
    found: true;
    email: string;
    username: string | null;
    claimed: boolean;
    referralCode: string;
  };

const handler = createHandler();

handler.use(requireAuthMiddleware).get(async (req, res) => {
  // req.authId is guaranteed by requireAuthMiddleware — the verified
  // Privy DID. Resolve the email from that, not the access token (the
  // access token is not an identity token and getUser rejects it).
  const email = await getPrivyUserEmailById(req.authId, PRIVY_CFG).catch((err) => {
    console.error('Privy getUser failed during waitlist/me', err);
    return null;
  });
  if (!email) {
    const body: WaitlistMeResponse = { found: false };
    res.json(body);
    return;
  }

  const entry = await prisma.waitlistEntry.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      email: true,
      usernameLower: true,
      usernameDisplay: true,
      claimedAt: true,
      referralCode: true,
    },
  });
  if (!entry) {
    const body: WaitlistMeResponse = { found: false };
    res.json(body);
    return;
  }

  const body: WaitlistMeResponse = {
    found: true,
    email: entry.email,
    username: entry.usernameDisplay ?? entry.usernameLower,
    claimed: entry.claimedAt !== null,
    referralCode: entry.referralCode,
  };
  res.json(body);
});

export default handler;
