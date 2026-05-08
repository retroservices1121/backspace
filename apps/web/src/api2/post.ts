// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Post, Prisma } from '@prisma/client';

import memoize from 'utils/memo';

import prisma from './prisma';

const memoizedGetPost = memoize(getPost);

/**
 * Get a post table from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a user
 * @param  include optional relational fields to grab
 * @return unique matching user if one exists. Else null is returned
 */
export async function getPost(
  uniqueField: Prisma.PostWhereUniqueInput, 
  include? : Prisma.PostInclude) : Promise<Post | null> {
  const request : Prisma.PostFindUniqueArgs = { where: uniqueField, include };
  try {
    const matchedUser = await prisma.post.findUnique(request);
    return matchedUser ;
  } catch (error) {
    console.error(error);
  }
  return null;
}

export const postWithUser = Prisma.validator<Prisma.PostArgs>()({
  include: {
    media: true,
    author: true,
    _count: {
      select: {
        likes: true,
        comments: true,
      },
    },
  },
});

export type PostWithUser = Prisma.PostGetPayload<typeof postWithUser>;
/**
 * Get a post table from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a user
 * @param  include optional relational fields to grab
 * @return unique matching user if one exists. Else null is returned
 */
export async function getPosts(
  uniqueField: Prisma.PostWhereInput, 
  include? : Prisma.PostInclude) : Promise<Post[] | null> {
  const request : Prisma.PostFindManyArgs = { where: uniqueField, include };
  const matchedUser = await prisma.post.findMany(request);
  return matchedUser ;
}

/**
 * Find a post using the ID
 * @param  id unique id of post
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching post if one exists. Else null is returned
 */
export async function findPostById(id: bigint, useCache: boolean = false): Promise<Post | null> {
  const includes : Prisma.PostInclude = undefined;
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetPost.clear({ id }, includes); 
  }
  return memoizedGetPost({ id }, includes);
}

/**
 * Find a post using the Firebase ID
 * @param  fbid unique firebase identifier
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching post if one exists. Else null is returned
 */
export async function findPostByFbId(fbid: string, useCache: boolean = false): Promise<Post | null> {
  const includes : Prisma.PostInclude = undefined;
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetPost.clear({ fbid }, includes); 
  }
  return memoizedGetPost({ fbid }, includes);
}

// Currently only designed for firebase migration usage
export async function upsertPost(firebaseId: string, createData: Prisma.PostCreateInput, updateData: Prisma.PostUpdateInput) {
  const update = await prisma.post.upsert({
    where: { fbid: firebaseId },
    update: updateData,
    create: createData,
  }).catch((e) => console.error(`Failed to upsert post ${firebaseId} ${e}`));
  return update;
}

export async function createPost(postData : Prisma.PostCreateInput) {
  const newPost = await prisma.post.create({
    data: postData,
  }).catch((e) => console.error(`Failed to create new post ${postData.id || postData.fbid} ${e}`));
  return newPost;
}

export async function updatePost(id: bigint, userData: Prisma.PostUpdateInput) {
  const update = await prisma.post.update({
    where: { id },
    data: userData,
  }).catch(() => console.error(`Failed to update post ${id}`));
  return update;
}

/**
 * Remove a post entry by id
 * @param  id id of post to update
 * @return removed post
 */
export async function deletePost(id: bigint) {
  return prisma.post.delete({ where: { id } });
}
