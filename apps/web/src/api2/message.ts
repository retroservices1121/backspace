// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Message, Prisma } from '@prisma/client';

import memoize from 'utils/memo';

import prisma from './prisma';

const memoizedGetMessage = memoize(getMessage);

/**
 * Get a message table from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a message
 * @param  include optional relational fields to grab
 * @return unique matching message if one exists. Else null is returned
 */
export async function getMessage(
  uniqueField: Prisma.MessageWhereUniqueInput, 
  include? : Prisma.MessageInclude) : Promise<Message | null> {
  const request : Prisma.MessageFindUniqueArgs = { where: uniqueField, include };
  const matchedUser = await prisma.message.findUnique(request);
  return matchedUser ;
}

/**
 * Find a message by id
 * @param  id unique id of message
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching message if one exists. Else null is returned
 */
export async function getMessageById(id: bigint, useCache: boolean = false): Promise<Message | null> {
  const includes : Prisma.MessageInclude = undefined;
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetMessage.clear({ id }, includes); 
  }
  return memoizedGetMessage({ id }, includes);
}

export async function createMessage(data : Prisma.MessageCreateInput) {
  const newMessage = await prisma.message.create({
    data: data,
  }).catch(() => console.error(`Failed to create new message ${data.id || data.text}`));
  return newMessage;
}

export async function updateMessage(id: bigint, userData: Prisma.MessageUpdateInput) {
  const update = await prisma.message.update({
    where: { id },
    data: userData,
  }).catch(() => console.error(`Failed to update message ${id}`));
  return update;
}

/**
 * Remove a message entry by id
 * @param  id id of message to update
 * @return removed message
 */
export async function deleteMessage(id: bigint) {
  return prisma.message.delete({ where: { id } });
}
