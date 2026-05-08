// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Media, MediaUse, Prisma } from '@prisma/client';

import memoize from 'utils/memo';

import prisma from './prisma';

const memoizedGetMedia = memoize(getMedia);


function uniqueSearchFromType(type: MediaUse, id: bigint): Prisma.MediaWhereUniqueInput {
  switch (type) {
    case MediaUse.AVATAR:
      return { avatarUserId: id };
    case MediaUse.BANNER:
      return { bannerUserId: id };
    case MediaUse.COMMUNITY_AVATAR:
      return { avatarCommunityId: id };
    case MediaUse.COMMUNITY_BANNER:
      return { bannerCommunityId: id };
    case MediaUse.POST:
      return { id: id };
    default:
      return {};
  }
}


/**
 * Get a media table from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a user
 * @param  include optional relational fields to grab
 * @return unique matching user if one exists. Else null is returned
 */
export async function getMedia(
  uniqueField: Prisma.MediaWhereUniqueInput, 
  include? : Prisma.MediaInclude) : Promise<Media | null> {
  const request : Prisma.MediaFindUniqueArgs = { where: uniqueField, include };
  const matchedUser = await prisma.media.findUnique(request);
  return matchedUser ;
}

/**
 * Find media by it's relationship id
 * @param  type MediaUse type
 * @param  id id of relationship (i.e. userId)
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching user if one exists. Else null is returned
 */
export async function findMediaByLinkedId(type: MediaUse, relationId: bigint, useCache: boolean = false): Promise<Media | null> {
  const includes : Prisma.MediaInclude = undefined;
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetMedia.clear(uniqueSearchFromType(type, relationId), includes); 
  }
  return memoizedGetMedia(uniqueSearchFromType(type, relationId), includes);
}

export async function upsertMedia(type: MediaUse, relationId: bigint, createData: Prisma.MediaCreateInput) {
  const update = await prisma.media.upsert({
    where: uniqueSearchFromType(type, relationId),
    update: createData,
    create: createData,
  }).catch((e) => console.error(`Failed to upcert media for ${type} id:${relationId} ${e}`));
  return update;
}

export async function createMedia(data : Prisma.MediaCreateInput) {
  const newMedia = await prisma.media.create({
    data: data,
  }).catch(() => console.error('Failed to create new media'));
  return newMedia;
}

export async function updateMedia(id: bigint, userId: bigint, userData: Prisma.MediaUpdateInput) {
  const update = await prisma.media.update({
    where: { id },
    data: userData,
  }).catch(() => console.error(`Failed to update media ${userId}`));
  return update;
}

/**
 * Remove a media entry by id
 * @param  id id of media to update
 * @return removed media
 */
export async function deleteMedia(id: bigint) {
  return prisma.media.delete({ where: { id } });
}
