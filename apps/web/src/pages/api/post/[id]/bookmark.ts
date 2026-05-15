// Toggle a bookmark on a post — symmetric to /repost.
//   POST   /api/post/[id]/bookmark
//   DELETE /api/post/[id]/bookmark

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

const handler = createHandler();

const resolveUserId = async (authId: string) => {
  const user = await prisma.user.findUnique({ where: { authId }, select: { id: true } });
  return user?.id;
};

const respond = async (postId: bigint, userId: bigint, res) => {
  const [count, mine] = await Promise.all([
    prisma.bookmark.count({ where: { postId } }),
    prisma.bookmark.findUnique({
      where: { userBookmark: { postId, userId } },
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
      await prisma.bookmark.create({ data: { postId, userId } });
    } catch (err: any) {
      if (err?.code !== 'P2002') throw err;
    }
    await respond(postId, userId, res);
  })
  .delete(async (req, res) => {
    const { id } = req.query;
    const userId = await resolveUserId(req.authId);
    if (!userId) return res.status(401).end();
    const postId = BigInt(id as string);
    await prisma.bookmark.deleteMany({ where: { postId, userId } });
    await respond(postId, userId, res);
  });

export default handler;
