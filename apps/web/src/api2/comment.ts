// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Comment, Prisma } from '@prisma/client';
import memoize from 'utils/memo';

import prisma from './prisma';

//Internal memoized comment instance
const memoizedGetComment = memoize(getComment);

/**
 * Get a comment table from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a user
 * @param  include optional relational fields to grab
 * @return unique matching user if one exists. Else null is returned
 */
export async function getComment(
  uniqueField: Prisma.CommentWhereUniqueInput, 
  include : Prisma.CommentInclude = undefined) : Promise<Comment | null> {
  const request : Prisma.CommentFindUniqueArgs = { where: uniqueField, include };
  const matchedUser = await prisma.comment.findUnique(request);
  return matchedUser ;
}

/**
 * Find a comment by id
 * @param  id unique id of comment
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching comment if one exists. Else null is returned
 */
export async function getCommentById(id: bigint, useCache: boolean = false): Promise<Comment | null> {
  const includes : Prisma.CommentInclude = {};
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetComment.clear({ id }, includes); 
  }
  return memoizedGetComment({ id }, includes);
}

/**
 * Create a new comment
 * @param  data data required to create a comment
 * @return returns newly created comment.
 */
export async function createComment(data : Prisma.CommentCreateInput) {
  const newComment = await prisma.comment.create({
    data: data,
  }).catch(() => console.error(`Failed to create new comment ${data.text}`));
  return newComment;
}

/**
 * Create a new comment
 * @param  id id of comment to update
 * @param  update data required to update comment
 * @return returns newly updated comment.
 */
export async function updateComment(id: bigint, update: Prisma.CommentUpdateInput) {
  const updated = await prisma.comment.update({
    where: { id },
    data: update,
  }).catch(() => console.error(`Failed to update comment ${id}`));
  return updated;
}

/**
 * Create or update a new comment
 * @param  fbid unique firebase id of the comment (for porting)
 * @param  data data required to create a comment
 * @return returns newly updated/created comment.
 */
export async function upsertComment(fbid: string, data : Prisma.CommentCreateInput) {
  const upsertedComment = await prisma.comment.upsert({
    where: { fbid },
    create: data,
    update: data,
  }).catch(() => console.error(`Failed to upsert new comment ${fbid}`));
  return upsertedComment;
}

/**
 * Remove a comment entry by id
 * @param  id id of comment to update
 * @return removed comment
 */
export async function deleteComment(id: bigint) {
  return prisma.comment.delete({ where: { id } });
}