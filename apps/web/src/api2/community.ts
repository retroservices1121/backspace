// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Community, Prisma } from '@prisma/client';
import { isDecorator } from 'typescript';

import memoize from 'utils/memo';

import prisma from './prisma';

export const memoizedGetCommunity = memoize(getCommunity);
export const memoizedGetCommunities = memoize(getCommunities);

/**
 * Get a community from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a community
 * @param  include optional relational fields to grab
 * @return unique matching community if one exists. Else null is returned
 */
export async function getCommunity(
  uniqueField: Prisma.CommunityWhereUniqueInput,
  include?: Prisma.CommunityInclude,
): Promise<Community | null> {
  const request: Prisma.CommunityFindUniqueArgs = { where: uniqueField, include };
  const matchedCommunity = await prisma.community.findUnique(request);
  return matchedCommunity;
}

/**
 * Get a community from the database. This function often is wrapped with a simplified call
 * @param  searchField unique criteria that identifies a community
 * @param  include optional relational fields to grab
 * @return unique matching community if one exists. Else null is returned
 */
export async function getCommunities(
  searchField: Prisma.CommunityWhereInput,
  include?: Prisma.CommunityInclude,
): Promise<Community[] | null> {
  const request: Prisma.CommunityFindManyArgs = { where: searchField, include };
  const matchedCommunitys = await prisma.community.findMany(request);
  return matchedCommunitys;
}

export async function getCommunitiesByAuthId(authId: string, include?: Prisma.CommunityInclude) {
  const matchedCommunitys = await prisma.community.findMany({
    include,
    where: {
      members: {
        every: {
          user: { authId },
        },
      },
    },
  });
  return matchedCommunitys;
}

export async function getCommunitiesByFbid(fbid: string, useCache = true) {
  const includes : Prisma.CommunityInclude = {
    avatar: true,
  };

  if (!useCache) { //Clear memoized user using arguments
    memoizedGetCommunity.clear({ fbid }, includes); 
  }
  return memoizedGetCommunity({ fbid }, includes);
}

export async function createCommunity(communityData: Prisma.CommunityCreateInput) {
  return await prisma.community.create({
    data: communityData,
  }).catch(() => console.error(`Failed to create new community ${communityData.owner.connect.authId}`)) || null;
}

export async function updateCommunity(id: bigint, communityData: Prisma.CommunityUpdateInput) {
  return await prisma.community.update({
    where: { id },
    data: communityData,
  }).catch(() => console.error(`Failed to update community ${id}`)) || null;
}

export async function deleteCommunity() {
  throw new Error('Delete Community is not implemented');
}

export async function getUserSpaces(authId: string) {
  const communities = await prisma.user.findFirst({
    include: {
      communities: {
        include: {
          channels: true,
          members: true,
          owner: true,
        },
      },
    },
    where: {
      authId,
    },
  });
  return communities;
}