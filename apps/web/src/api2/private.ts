// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Prisma, Private } from '@prisma/client';
import memoize from 'utils/memo';

import prisma from './prisma';

//Internal memoized private instance
const memoizedGetPrivate = memoize(getPrivate);

/**
 * Get a private table from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a user
 * @param  include optional relational fields to grab
 * @return unique matching user if one exists. Else null is returned
 */
export async function getPrivate(
  uniqueField: Prisma.PrivateWhereUniqueInput, 
  include : Prisma.PrivateInclude = undefined) : Promise<Private | null> {
  const request : Prisma.PrivateFindUniqueArgs = { where: uniqueField, include };
  const matchedUser = await prisma.private.findUnique(request);
  return matchedUser ;
}

/**
 * Find a private by id
 * @param  userId unique id of private
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching private if one exists. Else null is returned
 */
export async function getPrivateByUserId(userId: bigint, useCache: boolean = false): Promise<Private | null> {
  const includes : Prisma.PrivateInclude = {};
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetPrivate.clear({ userId }, includes); 
  }
  return memoizedGetPrivate({ userId }, includes);
}

/**
 * Create a new private
 * @param  data data required to create a private
 * @return returns newly created private.
 */
export async function createPrivate(data : Prisma.PrivateCreateInput) {
  const newPrivate = await prisma.private.create({
    data: data,
  }).catch(() => console.error(`Failed to create new private ${data.user.connect.id || data.user.connect.authId}`));
  return newPrivate;
}

/**
 * Updates a new private
 * @param  userId id of private to update
 * @param  update data required to update private
 * @return returns newly updated private.
 */
export async function updatePrivate(userId: bigint, update: Prisma.PrivateUpdateInput) {
  const updated = await prisma.private.update({
    where: { userId },
    data: update,
  }).catch(() => console.error(`Failed to update private ${userId}`));
  return updated;
}

/**
 * Upcerts a new private
 * @param  createData data required to create a new private
 * @param  update data required to update private
 * @return returns newly updated private.
 */
export async function upcertPrivate(createData: Prisma.PrivateCreateInput) {
  const update = await prisma.private.upsert({
    where: { userId: createData.user.connect.id },
    update: createData,
    create: createData,
  }).catch(() => console.error(`Failed to upcert private ${createData.user.connect.id}`));
  return update;
}

/**
 * Remove a private entry by id
 * @param  userId id of private to update
 * @return removed private
 */
export async function deletePrivate(userId: bigint) {
  throw new Error('You should be cascading this delete from the user down');
  // return prisma.private.delete({ where: { userId } });
}