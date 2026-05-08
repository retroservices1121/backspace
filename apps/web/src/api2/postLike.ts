// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { PostLike, Prisma } from '@prisma/client';
import memoize from 'utils/memo';

import prisma from './prisma';

const memoizedGetPostLike = memoize(getPostLike);

/**
 * Get a postLike table from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a user
 * @param  include optional relational fields to grab
 * @return unique matching user if one exists. Else null is returned
 */
export async function getPostLike(
  uniqueField: Prisma.PostLikeWhereUniqueInput, 
  include? : Prisma.PostLikeInclude) : Promise<PostLike | null> {
  const request : Prisma.PostLikeFindUniqueArgs = { where: uniqueField, include };
  const matchedUser = await prisma.postLike.findUnique(request);
  return matchedUser ;
}

/**
 * Find a postLike using it's id
 * @param  id unique id of user
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching user if one exists. Else null is returned
 */
export async function findPostLikeById(id: bigint, useCache: boolean = false): Promise<PostLike | null> {
  const includes : Prisma.PostLikeInclude = undefined;
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetPostLike.clear({ id }, includes); 
  }
  return memoizedGetPostLike({ id }, includes);
}

// Currently designed for migration from firebase only
export async function upcertPostLike(fbid: string, createData: Prisma.PostLikeCreateInput, updateData: Prisma.PostLikeUpdateInput) {
  const update = await prisma.postLike.upsert({
    where: { fbid },
    update: updateData,
    create: createData,
  }).catch(() => console.error(`Failed to upcert postLike ${fbid}`));
  return update;
}

export async function createPostLike(userData : Prisma.PostLikeCreateInput) {
  const newPostLike = await prisma.postLike.create({
    data: userData,
  }).catch(() => console.error(`Failed to create new postLike ${userData.id || userData.fbid}`));
  return newPostLike;
}

export async function updatePostLike(id: bigint, userData: Prisma.PostLikeUpdateInput) {
  const update = await prisma.postLike.update({
    where: { id },
    data: userData,
  }).catch(() => console.error(`Failed to update postLike ${id}`));
  return update;
}

export async function deletePostLike() {
  throw new Error('Delete PostLike is not implemented');
}
