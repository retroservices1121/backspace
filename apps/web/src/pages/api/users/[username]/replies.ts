// GET /api/users/[username]/replies
// Comments authored by this user, each paired with the parent post
// (light shape — just enough to render context above the reply on
// the profile). Newest first.

import prisma from '@src/api2/prisma';
import { Prisma } from '@prisma/client';
import createHandler from '@src/lib/nextconnect';
import { Comment } from '@src/types/prisma';

const handler = createHandler();

handler.get(async (req, res) => {
  const username = req.query.username as string;
  if (!username) return res.status(400).end('username required');

  const author = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!author) return res.status(404).end();

  const comments = await prisma.comment.findMany({
    where: { authorId: author.id },
    include: {
      ...Comment.include,
      // Viewer-scoped like overlay for the comment row.
      likes: { where: { user: { authId: req.authId ?? '__none__' } } },
      // Parent post context — just the fields the profile-reply card
      // shows (author handle + first line of text + uuid for linking).
      post: {
        select: {
          id: true,
          uuid: true,
          text: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              accountType: true,
              verified: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: Prisma.SortOrder.desc },
    take: 50,
  });
  res.json(comments);
});

export default handler;
