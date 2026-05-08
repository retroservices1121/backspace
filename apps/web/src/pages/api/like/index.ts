// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { Prisma } from '@prisma/client';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

export type LikeBody = {
  userId: bigint,
  postId: bigint,
  authorId: bigint,
  like: boolean,
};

const handler = createHandler();

handler
  .use(requireAuthMiddleware)
  .get(async (req, res) => {
    const {
      query: { postId, userId },
    } = req;

    const like = await prisma.postLike.findUnique({
      where: {
        userLike: {
          userId: BigInt(userId as string),
          postId: BigInt(postId as string),
        },
      },
    });
    res.json(like);
  })
  .put(async (req, res) => {
    const { 
      authId,
      body,
    } = req;
    const typedBody : LikeBody = body;
    if (typedBody.like) {
      const newLike : Prisma.PostLikeCreateInput = {
        post: {
          connect: {
            id: BigInt(typedBody.postId),
          },
        },
        postOwner: {
          connect: {
            id: BigInt(typedBody.authorId),
          },
        },
        user: {
          connect: {
            authId: authId,
          },
        },
      };
      const like = await prisma.postLike.create({
        data: newLike,
      });
      return res.json(like);
    } else { //Yes, I did put a delete in a put... but I can't put a body on a delete
      await prisma.postLike.delete({
        where: {
          userLike: {
            userId: BigInt(typedBody.userId),
            postId: BigInt(typedBody.postId),
          },
        },
      });
      return res.end('deleted');
    }


  });

export default handler;