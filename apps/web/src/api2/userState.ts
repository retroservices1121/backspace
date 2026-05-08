// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Prisma, UserState } from '@prisma/client';
import memoize from 'utils/memo';

import prisma from './prisma';

const memoizedGetUserState = memoize(getUserState);

/**
 * Get a userState table from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a user
 * @param  include optional relational fields to grab
 * @return unique matching user if one exists. Else null is returned
 */
export async function getUserState(
  uniqueField: Prisma.UserStateWhereUniqueInput, 
  include : Array<keyof Prisma.UserStateInclude> = []) : Promise<UserState | null> {
  const request : Prisma.UserStateFindUniqueArgs = { where: uniqueField };
  include.forEach((each) => {
    if (!request.include) request.include = {};
    request.include[each] = true;
  });
  const matchedUser = await prisma.userState.findUnique(request);
  return matchedUser ;
}

/**
 * Find a user by username and get id
 * @param  username unique id of user
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching user if one exists. Else null is returned
 */
export async function findUserStateByUserId(userId: bigint, useCache: boolean = false): Promise<UserState | null> {
  const includes : Array<keyof Prisma.UserStateInclude> = [];
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetUserState.clear({ userId }, includes); 
  }
  return memoizedGetUserState({ userId }, includes);
}

export async function upsertUserState(userId: bigint, createData: Prisma.UserStateCreateInput, updateData: Prisma.UserStateUpdateInput) {
  const update = await prisma.userState.upsert({
    where: { userId: userId },
    update: updateData,
    create: createData,
  }).catch(() => console.error(`Failed to upcert userState ${createData.user.connect.id}`));
  return update;
}

export async function createUserState(userData : Prisma.UserStateCreateInput) {
  const newUserState = await prisma.userState.create({
    data: userData,
  }).catch(() => console.error(`Failed to create new userState ${userData.user.connect}`));
  return newUserState;
}

export async function updateUserState(userId: bigint, userData: Prisma.UserStateUpdateInput) {
  const update = await prisma.userState.update({
    where: { userId },
    data: userData,
  }).catch(() => console.error(`Failed to update userState ${userId}`));
  return update;
}

export async function deleteUserState() {
  throw new Error('Delete UserState is not implemented');
}