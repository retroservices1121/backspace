// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Follow, Prisma } from '@prisma/client';

import memoize from 'utils/memo';

import prisma from './prisma';

//Internal memoized follow instance
const memoizedGetFollow = memoize(getFollow);

/**
 * Get a follow table from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a user
 * @param  include optional relational fields to grab
 * @return unique matching user if one exists. Else null is returned
 */
export async function getFollow(
  uniqueField: Prisma.FollowWhereUniqueInput, 
  include : Prisma.FollowInclude = undefined) : Promise<Follow | null> {
  const request : Prisma.FollowFindUniqueArgs = { where: uniqueField, include };
  const matchedUser = await prisma.follow.findUnique(request);
  return matchedUser ;
}

/**
 * Find a follow by id
 * @param  id unique id of follow
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching follow if one exists. Else null is returned
 */
export async function getFollowById(id: bigint, useCache: boolean = false): Promise<Follow | null> {
  const includes : Prisma.FollowInclude = {};
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetFollow.clear({ id }, includes); 
  }
  return memoizedGetFollow({ id }, includes);
}

/**
 * Find a follow by id
 * @param  followerId unique id of follower
 * @param  accountId unique id of account being followed
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching follow if one exists. Else null is returned
 * TODO: Create an endpoint so that we can fetch follows jit. & have the database do the filter instead of the frontend
export async function getFollowbyUserAndAccount(followerId: bigint, accountId: bigint, useCache: boolean = false): Promise<Follow | null> {
  const includes : Prisma.follow.findUnique({ where: {
      accountId: accountId,
    }),
  };
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetFollow.clear({ followIdentifier: { accountId, followerId } }, includes); 
  }
  return memoizedGetFollow({ followIdentifier: { accountId, followerId } }, includes);
}
 */

/**
 * Create a new follow
 * @param  data data required to create a follow
 * @return returns newly created follow.
 */
export async function createFollow(data : Prisma.FollowCreateInput) {
  const newFollow = await prisma.follow.create({
    data: data,
  }).catch(() => console.error(`Failed to create new follow ${data.account}`));
  return newFollow;
}

/**
 * Create a new follow
 * @param  id id of follow to update
 * @param  update data required to update follow
 * @return returns newly updated follow.
 */
export async function updateFollow(id: bigint, update: Prisma.FollowUpdateInput) {
  const updated = await prisma.follow.update({
    where: { id },
    data: update,
  }).catch(() => console.error(`Failed to update follow ${id}`));
  return updated;
}

/**
 * Create or update a new follow
 * @param  followerId unique id of follower
 * @param  accountId unique id of account being followed
 * @param  data data required to create a follow
 * @return returns newly updated/created follow.
 */
export async function upsertFollow(followerId: bigint, accountId: bigint, data : Prisma.FollowCreateInput) {
  const newFollow = await prisma.follow.upsert({
    where: { followIdentifier: { accountId, followerId } },
    create: data,
    update: data,
  }).catch(() => console.error(`Failed to upsert new follow ${data.account}`));
  return newFollow;
}


/**
 * Remove a follow entry by id
 * @param  id id of follow to update
 * @return removed follow
 */
export async function deleteFollow(id: bigint) {
  return prisma.follow.delete({ where: { id } });
}
