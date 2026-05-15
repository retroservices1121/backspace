// Toggle a repost on a given post.
//   POST   /api/post/[id]/repost   -> create (idempotent via unique)
//   DELETE /api/post/[id]/repost   -> remove
// Response shape mirrors the like endpoint: {count, mine}.

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

const handler = createHandler();

const resolveUserId = async (authId: string) => {
  const user = await prisma.user.findUnique({ where: { authId }, select: { id: true } });
  return user?.id;
};

const respond = async (postId: bigint, userId: bigint, res) => {
  const [count, mine] = await Promise.all([
    prisma.repost.count({ where: { postId } }),
    prisma.repost.findUnique({
      where: { userRepost: { postId, userId } },
      select: { id: true },
    }),
  ]);
  res.json({ count, mine: !!mine });
};

handler
  .use(requireAuthMiddleware)
  .post(async (req, res) => {
    const { id } = req.query;
    const userId = await resolveUserId(req.authId);
    if (!userId) return res.status(401).end();
    const postId = BigInt(id as string);
    try {
      await prisma.repost.create({ data: { postId, userId } });
    } catch (err: any) {
      // P2002 = unique violation; treat as a no-op idempotent retry.
      if (err?.code !== 'P2002') throw err;
    }
    await respond(postId, userId, res);
  })
  .delete(async (req, res) => {
    const { id } = req.query;
    const userId = await resolveUserId(req.authId);
    if (!userId) return res.status(401).end();
    const postId = BigInt(id as string);
    await prisma.repost.deleteMany({ where: { postId, userId } });
    await respond(postId, userId, res);
  });

export default handler;
