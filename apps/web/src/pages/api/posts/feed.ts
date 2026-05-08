// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { Permissions, Prisma } from '@prisma/client';
import prisma from '@src/api2/prisma';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { FilterOptions } from '@src/store/feedSlice';
import HttpStatus from 'http-status-codes';
import { resolve } from 'path';

import { Post, User } from 'types/prisma';

const handler = createHandler();

handler
  .use(requireAuthMiddleware)
  .get(async (req, res) => {
    const { 
      query: { filter },
      authId,
    } = req;
    let posts : any[]; 
    let user : User.DefaultUser = await prisma.user.findUnique({
      where: { authId },
      include: User.defaultArgs.include,
    });

    const postFindManyBase : Prisma.PostFindManyArgs = {
      take: 20,
      include: {
        ...Post.include,
        likes: { //This will add only my likes to the post fetch
          where: {
            user: {
              authId: authId,
            },
          },
        },
      },
      orderBy: {
        createdAt: Prisma.SortOrder.desc,
      },
    };

    switch (filter) {
      case FilterOptions.DISCOVER:
        posts = await prisma.post.findMany({
          ...postFindManyBase,
          where: {
            OR: [
              {
                message: {
                  channel: {
                    readPermission: Permissions.EVERYONE,
                  },
                },
              },
              {
                profileId: { //exists check
                  gte: 0,
                },
              },
            ],
          },
        });
        break;
      case FilterOptions.RECENT:
        posts = await prisma.post.findMany({
          ...postFindManyBase,
        });
        break;
      case FilterOptions.FOLLOWING:
        if (!user) break;
        posts = await prisma.post.findMany({
          ...postFindManyBase,
          where: {
            id: { in: user.following?.map((follow) => follow.accountId) },
          },
        });
        break;
      case FilterOptions.COMMUNITY:
        if (!user) break;
        posts = await prisma.post.findMany({
          ...postFindManyBase,
          where: {
            message: {
              communityId: { in: user.memberships?.map((each) => each.communityId) },
            },
          },
        });
        break;
      default:
        console.error(`Unsupported Filter of ${filter}`);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    res.json(posts);
    resolve();
  });

export default handler;