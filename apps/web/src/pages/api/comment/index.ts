// POST   /api/comment           - create comment on a post
// DELETE /api/comment?id=<id>   - delete one of your own comments
// PATCH  /api/comment?id=<id>   - edit your own comment text

import prisma from '@src/api2/prisma';
import { Prisma } from '@prisma/client';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { Comment } from '@src/types/prisma';

export type CommentBody = {
  postId: bigint,
  text: string,
};

const handler = createHandler();

// Returns true if the requesting user authored the comment, else a
// {status, body} response describing why not. Used by mutating
// handlers so a stranger can't delete/edit your reply.
const assertCommentAuthor = async (authId: string | undefined, commentId: bigint) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { author: { select: { authId: true } } },
  });
  if (!comment) return { status: 404, body: 'Not found' } as const;
  if (!authId || comment.author?.authId !== authId) {
    return { status: 403, body: 'Forbidden' } as const;
  }
  return true as const;
};

handler
  .use(requireAuthMiddleware)
  .post(async (req, res) => {
    const { body, authId } = req;
    const typedBody : CommentBody = body;
    const data : Prisma.CommentCreateInput = {
      text: typedBody.text,
      post:   { connect: { id: BigInt(body.postId) } },
      author: { connect: { authId } },
    };
    const comment = await prisma.comment.create({
      data,
      include: {
        ...Comment.include,
        // Viewer-scoped likes so the response shape matches the GET.
        likes: { where: { user: { authId } } },
      },
    });
    return res.json(comment);
  })
  .patch(async (req, res) => {
    const { authId } = req;
    const commentId = BigInt(req.query.id as string);
    const ok = await assertCommentAuthor(authId, commentId);
    if (ok !== true) return res.status(ok.status).end(ok.body);
    const { text } = req.body ?? {};
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).end('text required');
    }
    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: { text, edited: true },
      include: {
        ...Comment.include,
        likes: { where: { user: { authId } } },
      },
    });
    res.json(comment);
  })
  .delete(async (req, res) => {
    const commentId = BigInt(req.query.id as string);
    const ok = await assertCommentAuthor(req.authId, commentId);
    if (ok !== true) return res.status(ok.status).end(ok.body);
    await prisma.comment.delete({ where: { id: commentId } });
    res.end('Comment deleted');
  });

export default handler;
