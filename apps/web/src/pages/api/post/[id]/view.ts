// Impression counter. Increments Post.viewCount by 1 unless the
// requester is the author (X excludes self-views from the displayed
// count). Client is expected to dedupe per page-load; the server
// just trusts and increments.

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

const handler = createHandler();

handler
  .use(requireAuthMiddleware)
  .post(async (req, res) => {
    const postId = BigInt(req.query.id as string);
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { author: { select: { authId: true } } },
    });
    if (!post) return res.status(404).end();
    if (post.author?.authId === req.authId) {
      // Author view — don't increment, just echo the current count.
      const current = await prisma.post.findUnique({
        where: { id: postId },
        select: { viewCount: true },
      });
      return res.json({ viewCount: current?.viewCount ?? 0 });
    }
    const updated = await prisma.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });
    res.json({ viewCount: updated.viewCount });
  });

export default handler;
