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
        // Scope likes/reposts/bookmarks to the requesting user so the
        // client gets a zero/one-element array per row meaning "is
        // this mine." Counts come from _count regardless of viewer.
        likes:     { where: { user: { authId } } },
        reposts:   { where: { user: { authId } } },
        bookmarks: { where: { user: { authId } } },
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
      case FilterOptions.ACCURACY: {
        // "For You" — rank visible posts by author's UserAccuracy.rankingScore.
        // Authors without an accuracy row sort to the bottom; recency is the
        // tiebreak so a brand-new platform with all-zero scores still produces
        // a sensible feed.
        //
        // Recency floor: cap the candidate set to posts from the last 7 days.
        // Without this, a single high-accuracy author from months ago would
        // dominate the feed forever — the calibration boost is supposed to
        // surface *current* signal, not pin a hall of fame to the top.
        //
        // Visibility filter mirrors DISCOVER (EVERYONE-readable + profile
        // posts) — the ranking change shouldn't expose gated content.
        const FRESH_WINDOW_DAYS = 7;
        const since = new Date(Date.now() - FRESH_WINDOW_DAYS * 24 * 60 * 60 * 1000);
        posts = await prisma.post.findMany({
          ...postFindManyBase,
          orderBy: [
            { author: { accuracy: { rankingScore: Prisma.SortOrder.desc } } },
            { createdAt: Prisma.SortOrder.desc },
          ],
          where: {
            createdAt: { gte: since },
            OR: [
              { message: { channel: { readPermission: Permissions.EVERYONE } } },
              { profileId: { gte: 0 } },
            ],
          },
        });
        break;
      }
      default:
        console.error(`Unsupported Filter of ${filter}`);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    res.json(posts);
    resolve();
  });

export default handler;