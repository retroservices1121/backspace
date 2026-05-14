// GET /api/users/recent
//
// Powers the Discover sidebar's "Recent Users" rail. Returns
// recently-onboarded users (newest first), excluding the caller —
// so the sidebar always shows other people. No ranking signal yet
// beyond recency; that's deliberate (this is "who showed up
// recently", not a ranking surface — the feed handles ranking).
//
// Auth-required for parity with the rest of the app. Public
// discovery would be fine here in principle, but every other route
// gates on Privy session and we don't want to surprise crawlers.

import prisma from '@src/api2/prisma';
import { getUserByAuthId } from '@src/api2/user';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 50;

const handler = createHandler();

handler
  .use(requireAuthMiddleware)
  .get(async (req, res) => {
    const requested = Number.parseInt((req.query.limit as string) ?? '', 10);
    const limit = Number.isFinite(requested) && requested > 0
      ? Math.min(requested, MAX_LIMIT)
      : DEFAULT_LIMIT;

    const me = await getUserByAuthId(req.authId, false);

    const users = await prisma.user.findMany({
      where: {
        onboarded: true,
        ...(me ? { id: { not: me.id } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        uuid: true,
        username: true,
        name: true,
        bio: true,
        verified: true,
        accountType: true,
        createdAt: true,
        avatar: { select: { id: true, host: true, path: true, type: true } },
      },
    });

    res.json(
      users.map((u) => ({
        id: u.id.toString(),
        uuid: u.uuid,
        username: u.username,
        name: u.name,
        bio: u.bio,
        verified: u.verified,
        accountType: u.accountType,
        avatar: u.avatar
          ? {
            id: u.avatar.id.toString(),
            host: u.avatar.host,
            path: u.avatar.path,
            type: u.avatar.type,
          }
          : null,
      })),
    );
  });

export default handler;
