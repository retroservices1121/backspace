// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Prisma, User as PUser } from '@prisma/client';

import prisma from 'api2/prisma';
import { User } from 'types/prisma';  
import memoize from 'utils/memo';

import { postWithUser } from './post';


export const memoizedGetUser = memoize(getUser);
export const memoizedGetUsers = memoize(getUsers);

/**
 * Get a user from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a user
 * @param  include optional relational fields to grab
 * @return unique matching user if one exists. Else null is returned
 */
export async function getUser(
  uniqueField: Prisma.UserWhereUniqueInput,
  include : Prisma.UserInclude = undefined,
) {
  const request : Prisma.UserFindUniqueArgs = { where: uniqueField, include };
  const matchedUser = await prisma.user.findUnique(request);
  return matchedUser ;
}

/**
 * Get a user from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a user
 * @param  include optional relational fields to grab
 * @return unique matching user if one exists. Else null is returned
 */
export async function getMyUser(
  uniqueField: Prisma.UserWhereUniqueInput, 
): Promise<User.Self | null> {
  const matchedUser = await prisma.user.findUnique({
    where: uniqueField,
    include: User.Self.include,
  });
  return matchedUser ;
}

/**
 * Get a user from the database. This function often is wrapped with a simplified call
 * @param  searchField unique criteria that identifies a user
 * @param  include optional relational fields to grab
 * @return unique matching user if one exists. Else null is returned
 */
export async function getUsers(
  searchField: Prisma.UserWhereInput, 
  include : Array<keyof Prisma.UserInclude> = []) : Promise<PUser[] | null> {
  const request : Prisma.UserFindManyArgs = { where: searchField };
  include.forEach((each) => {
    if (!request.include) request.include = {};
    //@ts-expect-error This appeared long after I wrote this section of code...
    request.include[each] = true;
  });
  const matchedUsers = await prisma.user.findMany(request);
  return matchedUsers;
}

/**
 * Fetch a user with content to fill out profile page
 * @param  id unique id of user
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching user if one exists. Else null is returned
 */
export async function getUserWithProfile(id: bigint, useCache: boolean = true): Promise<PUser | null> {
  const includes : Prisma.UserInclude = {
    avatar: true, 
    banner: true,
    posts: true,
  };
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetUser.clear({ id }, includes);
  }
  return memoizedGetUser({ id }, includes);
}

/**
 * Fetch a user with content to fill out profile page
 * @param  id unique id of user
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching user if one exists. Else null is returned
 */
export async function getUserById(id: bigint, useCache: boolean = true): Promise<User | null> {
  const includes = User.include;
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetUser.clear({ id: BigInt(id) }, includes);
  }
  //TODO fix the type on this
  return memoizedGetUser({ id: BigInt(id) }, includes) as Promise<User>;
}

/**
 * Fetch a user with content to fill out profile page
 * @param  authId unique id of user using for authentication
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching user if one exists. Else null is returned
 */
export async function getUserByAuthId(authId: string, useCache: boolean = true): Promise<User | null> {
  const includes = User.include;
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetUser.clear({ authId }, includes);
  }
  //TODO fix the type on this
  return memoizedGetUser({ authId }, includes) as Promise<User>;
}

/**
 * Fetch a user with content to fill out profile page
 * @param  username unique public username
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching user if one exists. Else null is returned
 */
export async function getUserByUsername(username: string, useCache: boolean = true): Promise<User | null> {
  const includes = User.defaultArgs.include;
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetUser.clear({ username }, includes);
  }
  //TODO fix the type on this
  return memoizedGetUser({ username }, includes) as Promise<User>;
}

const profileAttributes = Prisma.validator<Prisma.UserInclude>()({
  avatar: true,
  banner: true,
  state: true,
  communities: true,
  _count: {
    select: { likesRecieved: true, posts: true, followers: true, following: true },
  },
  followers: true,
  //following: true,
  posts: {
    orderBy: {
      createdAt: 'desc',
    },
    include: postWithUser.include,
  },
});

const userProfile = Prisma.validator<Prisma.UserArgs>()({
  include: profileAttributes,
});

export type UserWithProfile = Prisma.UserGetPayload<typeof userProfile>;

/**
 * Fetch a user with content to fill out profile page using their username
 * @param  username unique username of user
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching user if one exists. Else null is returned
 */
export async function getUserByUsernameWithProfile(username: string, useCache: boolean = true) {
  const includes = profileAttributes;
  //TODO We can probably find a clever way to cache this user request with the standard 'getUserWithProfile'
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetUser.clear({ username }, includes);
  }
  return memoizedGetUser({ username }, includes);
}

/**
  * Fetch a user with content to fill out profile page
  * @param  id unique id of user
  * @param  useCache whether a cached version of the request is okay
  * @return unique matching user if one exists. Else null is returned
  */
export async function getUserByIdWithProfile(id: bigint, useCache: boolean = true) {
  const includes = profileAttributes;
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetUser.clear({ id }, includes);
  }
  return memoizedGetUser({ id }, includes);
}

/**
 * Fetch a user along with their avatar image
 * @param  id unique id of user
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching user if one exists. Else null is returned
 */
export async function getUserWithAvatar(id: bigint, useCache: boolean = true): Promise<PUser | null> {
  const includes : Prisma.UserInclude = {
    avatar: true,
  };
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetUser.clear({ id }, includes); 
  }
  return memoizedGetUser({ id }, includes);
}

/**
 * Find a user by username and get id
 * @param  username unique id of user
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching user if one exists. Else null is returned
 */
export async function findUserIdByUsername(username: string, useCache: boolean = false): Promise<PUser | null> {
  const includes : Prisma.UserInclude = undefined;
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetUser.clear({ username }, includes); 
  }
  return memoizedGetUser({ username }, includes);
}

/**
 * Find a user by username and get id
 * @param  username unique id of user
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching user if one exists. Else null is returned
 */
export async function findUserIdByAuthId(authId: string, useCache: boolean = false): Promise<PUser | null> {
  const includes : Prisma.UserInclude = undefined;
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetUser.clear({ authId }, includes); 
  }
  return memoizedGetUser({ authId }, includes);
}

export async function createUser(userData : Prisma.UserCreateInput) {
  return await prisma.user.create({
    data: userData,
  }).catch((e) => console.error(`Failed to create new user ${userData} ${e}`)) || null;
}

export async function updateUser(id: bigint, userData: Prisma.UserUpdateInput) {
  return await prisma.user.update({
    where: { id },
    data: userData,
  }).catch(() => console.error(`Failed to update user ${id}`)) || null;
}

export async function deleteUser() {
  throw new Error('Delete PUser is not implemented');
}


// Proof of deep query of user using posts
// export async function testing() {
//   const matchedUser = await prisma.post.findMany({
//     where: {author: {username: 'trafford'}},
//   });
//   return matchedUser;
// }
