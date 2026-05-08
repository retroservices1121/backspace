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
  .get(async (req, res) => {
    // Returns the users the authenticated caller follows. The sidebar
    // discover/suggestions UI uses this to render its list.
    //
    // Identity comes from req.authId so the response is always scoped to
    // the caller — query string is ignored deliberately.
    const me = await prisma.user.findUnique({ where: { authId: req.authId } });
    if (!me) {
      res.json([]);
      return;
    }
    const follows = await prisma.follow.findMany({
      where: { followerId: me.id },
      include: { account: { include: { avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    // Hand the consumer the followed users directly — the Follow row
    // itself isn't useful in the sidebar.
    res.json(follows.map((f) => f.account));
  })
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