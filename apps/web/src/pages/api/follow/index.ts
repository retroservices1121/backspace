// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { NotificationType, Prisma } from '@prisma/client';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';

export type FollowBody = {
  userId: bigint,
  accountId: bigint,
  follow: boolean,
};

const handler = createHandler();

handler
  .use(requireAuthMiddleware)
  .put(async (req, res) => {
    const { 
      authId,
      body,
    } = req;
    const typedBody : FollowBody = body;
    if (typedBody.follow) {
      const newFollow : Prisma.FollowCreateInput = {
        follower: {
          connect: {
            authId: authId,
          },
        },
        account: {
          connect: {
            id: BigInt(typedBody.accountId),
          },
        },
        notification: {
          create: {
            type: NotificationType.FOLLOW,
            user: {
              connect: {
                id: BigInt(typedBody.accountId),
              },
            },
          },
        },
      };
      const follow = await prisma.follow.create({
        data: newFollow,
      });
      return res.json(follow);
    } else { //Yes, I did put a delete in a put... but I can't put a body on a delete
      await prisma.follow.delete({
        where: {
          followIdentifier: {
            followerId: BigInt(typedBody.userId),
            accountId: BigInt(typedBody.accountId),
          },
        },
      });
      return res.end('deleted');
    }


  });

export default handler;