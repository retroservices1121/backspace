// GET /api/users/[username]/following
// Users this profile follows. Returns a flat list shaped for the
// connections page; same payload shape as the followers endpoint so
// the UI can share a single row component.

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

  const me = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!me) return res.status(HttpStatus.NOT_FOUND).end();

  const rawLimit = Number(req.query.limit ?? DEFAULT_LIMIT);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT),
  );

  const rows = await prisma.follow.findMany({
    where: { followerId: me.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      account: {
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
    .map((r) => r.account)
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
