// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { Prisma } from '@prisma/client';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

export type CommentBody = {
  postId: bigint,
  text: string,
};

const handler = createHandler();

handler
  .use(requireAuthMiddleware)
  .post(async (req, res) => {
    const {
      body,
      authId,
    } = req;
    const typedBody : CommentBody = body;
    const newComment : Prisma.CommentCreateInput = {
      text: typedBody.text,
      post: {
        connect: {
          id: BigInt(body.postId),
        },
      },
      author: {
        connect: {
          authId: authId,
        },
      },
    };
    const comment = await prisma.comment.create({
      data: newComment,
    });
    return res.json(comment);
  })
  .delete(async (req, res) => {
    const {
      query: { id },
    } = req;
    await prisma.comment.delete({
      where: {
        id: BigInt(id as string),
      },
    });
    res.end('Comment Deleted');
  });

export default handler;