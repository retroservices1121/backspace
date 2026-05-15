// GET /api/users/[username]/posts
// Authored posts (excluding profile=null check — profile + community
// posts both count as "this user's posts" on their wall). Same payload
// shape as the timeline feed so MediaPost renders unchanged.

import prisma from '@src/api2/prisma';
import { Prisma } from '@prisma/client';
import createHandler from '@src/lib/nextconnect';
import { Post } from '@src/types/prisma';

const handler = createHandler();

handler.get(async (req, res) => {
  const username = req.query.username as string;
  if (!username) return res.status(400).end('username required');

  const author = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!author) return res.status(404).end();

  const posts = await prisma.post.findMany({
    where: { authorId: author.id },
    include: {
      ...Post.include,
      // Viewer-scoped overlays only matter when authed; otherwise
      // these come back empty and the UI treats it as "not mine."
      likes:     { where: { user: { authId: req.authId ?? '__none__' } } },
      reposts:   { where: { user: { authId: req.authId ?? '__none__' } } },
      bookmarks: { where: { user: { authId: req.authId ?? '__none__' } } },
    },
    orderBy: { createdAt: Prisma.SortOrder.desc },
    take: 50,
  });
  res.json(posts);
});

export default handler;
