// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { DirectMessage, Prisma } from '@prisma/client';
import memoize from 'utils/memo';

import prisma from './prisma';

//Internal memoized directMessage instance
const memoizedGetDirectMessage = memoize(getDirectMessage);

/**
 * Get a directMessage table from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a user
 * @param  include optional relational fields to grab
 * @return unique matching user if one exists. Else null is returned
 */
export async function getDirectMessage(
  uniqueField: Prisma.DirectMessageWhereUniqueInput, 
  include : Prisma.DirectMessageInclude = undefined) : Promise<DirectMessage | null> {
  const request : Prisma.DirectMessageFindUniqueArgs = { where: uniqueField, include };
  const matchedUser = await prisma.directMessage.findUnique(request);
  return matchedUser ;
}

/**
 * Find a directMessage by id
 * @param  id unique id of directMessage
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching directMessage if one exists. Else null is returned
 */
export async function getDirectMessageById(id: bigint, useCache: boolean = false): Promise<DirectMessage | null> {
  const includes : Prisma.DirectMessageInclude = {};
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetDirectMessage.clear({ id }, includes); 
  }
  return memoizedGetDirectMessage({ id }, includes);
}

/**
 * Create a new directMessage
 * @param  data data required to create a directMessage
 * @return returns newly created directMessage.
 */
export async function createDirectMessage(data : Prisma.DirectMessageCreateInput) {
  const newDirectMessage = await prisma.directMessage.create({
    data: data,
  }).catch((e) => console.error(`Failed to create new directMessage ${data.text} ${e}`));
  return newDirectMessage;
}

/**
 * Create a new directMessage
 * @param  id id of directMessage to update
 * @param  update data required to update directMessage
 * @return returns newly updated directMessage.
 */
export async function updateDirectMessage(id: bigint, update: Prisma.DirectMessageUpdateInput) {
  const updated = await prisma.directMessage.update({
    where: { id },
    data: update,
  }).catch(() => console.error(`Failed to update directMessage ${id}`));
  return updated;
}

/**
 * Create or update a new directMessage
 * @param  fbid unique firebase id of the directMessage (for porting)
 * @param  data data required to create a directMessage
 * @return returns newly updated/created directMessage.
 */
// export async function upsertDirectMessage(fbid: string, data : Prisma.DirectMessageCreateInput) {
//   const upsertedDirectMessage = await prisma.directMessage.upsert({
//     where: { fbid },
//     create: data,
//     update: data,
//   }).catch(() => console.error(`Failed to upsert new directMessage ${fbid}`));
//   return upsertedDirectMessage;
// }

/**
 * Remove a directMessage entry by id
 * @param  id id of directMessage to update
 * @return removed directMessage
 */
export async function deleteDirectMessage(id: bigint) {
  return prisma.directMessage.delete({ where: { id } });
}