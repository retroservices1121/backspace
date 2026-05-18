// GET /api/users/me/bookmarks
//
// Returns the caller's bookmarked posts, newest bookmark first.
// Mirrors the post payload shape the feed already consumes
// (Post.include) so the bookmarks page can render <NewPost /> rows
// straight from this response without extra hydration.

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import HttpStatus from 'http-status-codes';
import { Post } from 'types/prisma';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const handler = createHandler();
handler.use(requireAuthMiddleware);

handler.get(async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { authId: req.authId },
    select: { id: true },
  });
  if (!me) return res.status(HttpStatus.NOT_FOUND).end();

  const rawLimit = Number(req.query.limit ?? DEFAULT_LIMIT);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT),
  );

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      post: { include: Post.include },
    },
  });

  // Filter out bookmarks whose post was deleted (post.deletedAt set,
  // or the relation came back null because of a cascade gap). The
  // bookmark row may have been kept by FK rules; not the post.
  const posts = bookmarks
    .map((b) => b.post)
    .filter((p): p is NonNullable<typeof p> => !!p);

  return res.status(HttpStatus.OK).json(posts);
});

export default handler;
