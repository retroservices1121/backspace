// GET /api/users/[username]/followers
// Users who follow this profile. Returns a flat list shaped for the
// connections page: id/username/name/bio + raw avatar Media row.
// Public — same visibility as the profile itself.

import prisma from '@src/api2/prisma';
import createHandler from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';
import type { NextApiRequest, NextApiResponse } from 'next';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

const handler = createHandler();

handler.get(async (req: NextApiRequest, res: NextApiResponse) => {
  const username = req.query.username as string;
  if (!username) return res.status(HttpStatus.BAD_REQUEST).end('username required');

  const account = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!account) return res.status(HttpStatus.NOT_FOUND).end();

  const rawLimit = Number(req.query.limit ?? DEFAULT_LIMIT);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT),
  );

  const rows = await prisma.follow.findMany({
    where: { accountId: account.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          name: true,
          bio: true,
          verified: true,
          accountType: true,
          createdAt: true,
          avatar: true,
        },
      },
    },
  });

  const body = rows
    .map((r) => r.follower)
    .filter(Boolean)
    .map((u) => ({
      id: u!.id.toString(),
      username: u!.username,
      name: u!.name ?? u!.username,
      bio: u!.bio ?? null,
      verified: u!.verified,
      accountType: u!.accountType,
      createdAt: u!.createdAt,
      avatar: u!.avatar,
    }));

  return res.status(HttpStatus.OK).json(body);
});

export default handler;
