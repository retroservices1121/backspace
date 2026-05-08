// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Prisma, ReservedUser } from '@prisma/client';
import prisma from 'api2/prisma';

import memoize from 'utils/memo';

export const memoizedGetReservedUser = memoize(getReservedUser);

/**
 * Get a reservedUser from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a reservedUser
 * @param  include optional relational fields to grab
 * @return unique matching reservedUser if one exists. Else null is returned
 */
export async function getReservedUser(
  uniqueField: Prisma.ReservedUserWhereUniqueInput,
) {
  const request : Prisma.ReservedUserFindUniqueArgs = { where: uniqueField };
  const matchedReservedUser = await prisma.reservedUser.findUnique(request);
  return matchedReservedUser ;
}

/**
 * Fetch a reservedUser with content to fill out profile page
 * @param  id unique id of reservedUser
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching reservedUser if one exists. Else null is returned
 */
export async function getReservedUserById(id: bigint, useCache: boolean = true): Promise<ReservedUser | null> {
  if (!useCache) { //Clear memoized reservedUser using arguments
    memoizedGetReservedUser.clear({ id: BigInt(id) });
  }
  return memoizedGetReservedUser({ id: BigInt(id) });
}

/**
 * Fetch a reservedUser
 * @param  username unique public username
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching reservedUser if one exists. Else null is returned
 */
export async function getReservedUserByUsername(username: string, useCache: boolean = true): Promise<ReservedUser | null> {
  if (!useCache) { //Clear memoized reservedUser using arguments
    memoizedGetReservedUser.clear({ username });
  }
  return memoizedGetReservedUser({ username });
}

export async function createReservedUser(data : Prisma.ReservedUserCreateInput) {
  return await prisma.reservedUser.create({
    data: data,
  }).catch(() => console.error(`Failed to create new reservedUser ${data}`)) || null;
}

export async function updateReservedUser(id: bigint, data: Prisma.ReservedUserUpdateInput) {
  return await prisma.reservedUser.update({
    where: { id },
    data: data,
  }).catch(() => console.error(`Failed to update reservedUser ${id}`)) || null;
}

export async function deleteReservedUser() {
  throw new Error('Delete ReservedUser is not implemented');
}

