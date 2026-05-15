// Toggle a like on a comment.
//   POST   /api/comment/[id]/like
//   DELETE /api/comment/[id]/like
// Symmetric to post repost/bookmark toggles. Response: {count, mine}.

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

const handler = createHandler();

const resolveContext = async (authId: string, commentId: bigint) => {
  const user = await prisma.user.findUnique({
    where: { authId },
    select: { id: true },
  });
  if (!user) return null;
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true },
  });
  if (!comment) return null;
  return { userId: user.id, commentOwnerId: comment.authorId };
};

const respond = async (commentId: bigint, userId: bigint, res) => {
  const [count, mine] = await Promise.all([
    prisma.commentLike.count({ where: { commentId } }),
    prisma.commentLike.findUnique({
      where: { userCommentLike: { commentId, userId } },
      select: { id: true },
    }),
  ]);
  res.json({ count, mine: !!mine });
};

handler
  .use(requireAuthMiddleware)
  .post(async (req, res) => {
    const commentId = BigInt(req.query.id as string);
    const ctx = await resolveContext(req.authId, commentId);
    if (!ctx) return res.status(404).end();
    try {
      await prisma.commentLike.create({
        data: {
          commentId,
          userId: ctx.userId,
          commentOwnerId: ctx.commentOwnerId,
        },
      });
    } catch (err: any) {
      // P2002 = unique violation; idempotent retry.
      if (err?.code !== 'P2002') throw err;
    }
    await respond(commentId, ctx.userId, res);
  })
  .delete(async (req, res) => {
    const commentId = BigInt(req.query.id as string);
    const ctx = await resolveContext(req.authId, commentId);
    if (!ctx) return res.status(404).end();
    await prisma.commentLike.deleteMany({
      where: { commentId, userId: ctx.userId },
    });
    await respond(commentId, ctx.userId, res);
  });

export default handler;
