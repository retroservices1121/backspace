// GET /api/users/[username]/likes
// Posts this user has liked, ordered by like recency. Returns Post[]
// (same shape as /posts) so MediaPost renders identically.

import prisma from '@src/api2/prisma';
import { Prisma } from '@prisma/client';
import createHandler from '@src/lib/nextconnect';
import { Post } from '@src/types/prisma';

const handler = createHandler();

handler.get(async (req, res) => {
  const username = req.query.username as string;
  if (!username) return res.status(400).end('username required');

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!user) return res.status(404).end();

  // Newest likes first. Join through PostLike → Post.
  const likes = await prisma.postLike.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: Prisma.SortOrder.desc },
    take: 50,
    select: {
      post: {
        include: {
          ...Post.include,
          likes:     { where: { user: { authId: req.authId ?? '__none__' } } },
          reposts:   { where: { user: { authId: req.authId ?? '__none__' } } },
          bookmarks: { where: { user: { authId: req.authId ?? '__none__' } } },
        },
      },
    },
  });
  res.json(likes.map((l) => l.post).filter(Boolean));
});

export default handler;
