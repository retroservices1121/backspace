// Public list of trending communities (= largest active ones) for
// the right rail's "Communities to join" card. Differs from
// /api/communities (which requires auth and returns only the caller's
// memberships) — this one is the discovery endpoint, no auth required.

import prisma from '@src/api2/prisma';
import createHandler from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';
import type { NextApiRequest, NextApiResponse } from 'next';

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

const handler = createHandler();

handler.get(async (req: NextApiRequest, res: NextApiResponse) => {
  const rawLimit = Number(req.query.limit ?? DEFAULT_LIMIT);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT),
  );

  // allowJoin=false communities are hidden from discovery (private /
  // invite-only). archivedAt filters soft-deleted ones.
  const rows = await prisma.community.findMany({
    where: {
      allowJoin: true,
      archivedAt: null,
    },
    take: limit,
    orderBy: [
      { members: { _count: 'desc' } },
      { createdAt: 'desc' },
    ],
    select: {
      id: true,
      uuid: true,
      name: true,
      description: true,
      avatar: { select: { path: true, host: true } },
      _count: { select: { members: true } },
    },
  });

  const body = rows.map((c) => ({
    id: c.id.toString(),
    uuid: c.uuid,
    name: c.name,
    description: c.description,
    avatar: c.avatar
      ? `https://${c.avatar.host}/${c.avatar.path}`
      : null,
    memberCount: c._count.members,
  }));

  return res.status(HttpStatus.OK).json(body);
});

export default handler;
