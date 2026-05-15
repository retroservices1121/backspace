// GET /api/comments?postId=
// Returns all comments on a post with author + per-viewer like state.
//
// The legacy PUT here toggled PostLike (not CommentLike — wrong table)
// and was never called from the client. Removed to keep this route a
// single-responsibility comments list. Comment likes live at
// /api/comment/[id]/like.

import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { Comment } from '@src/types/prisma';

const handler = createHandler();

handler
  .use(requireAuthMiddleware)
  .get(async (req, res) => {
    const { postId } = req.query;
    const comments = await prisma.comment.findMany({
      where: { postId: BigInt(postId as string) },
      include: {
        ...Comment.include,
        // Viewer-scoped likes — zero/one-element array meaning "is mine."
        likes: { where: { user: { authId: req.authId } } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(comments);
  });

export default handler;
