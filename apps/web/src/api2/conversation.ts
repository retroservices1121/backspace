// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Conversation, Prisma } from '@prisma/client';
import { insert } from 'formik';

import memoize from 'utils/memo';

import prisma from './prisma';

//Internal memoized conversation instance
// const memoizedGetConversation = memoize(getConversation);
const memoizedGetConversations = memoize(getConversations);

const defaultConversationInclude = Prisma.validator<Prisma.ConversationArgs>()({
  include: {
    members: {
      include: {
        avatar: true,
      },
    },
    messages: {
      include: {
        media: true,
      },
    },
  },
});
export type ConversationWithRelations = Prisma.ConversationGetPayload<typeof defaultConversationInclude>;

/**
 * Get a conversation table from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a user
 * @param  include optional relational fields to grab
 * @return unique matching user if one exists. Else null is returned
 */
// export async function getConversation(
//   uniqueField: Prisma.ConversationWhereUniqueInput, 
//   include : Prisma.ConversationInclude = undefined) : Promise<Conversation | null> {
//   const request : Prisma.ConversationFindUniqueArgs = { where: uniqueField, include };
//   const matchedUser = await prisma.conversation.findUnique(request);
//   return matchedUser ;
// }

/**
 * Get a conversation table from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a user
 * @param  include optional relational fields to grab
 * @return unique matching user if one exists. Else null is returned
 */
export async function getConversations(
  uniqueField: Prisma.ConversationWhereInput, 
  include : Prisma.ConversationInclude = undefined) : Promise<Conversation[] | null> {
  const request : Prisma.ConversationFindManyArgs = { where: uniqueField, include };
  const matchedUser = await prisma.conversation.findMany(request);
  return matchedUser ;
}

/**
 * Find a conversation by id
 * @param  id unique id of conversation
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching conversation if one exists. Else null is returned
 */
// export async function getConversationById(id: bigint, useCache: boolean = false): Promise<Conversation | null> {
//   const includes : Prisma.ConversationInclude = defaultConversationInclude.include;
//   if (!useCache) { //Clear memoized user using arguments
//     memoizedGetConversation.clear({ id }, includes); 
//   }
//   return memoizedGetConversation({ id }, includes);
// }

/**
 * Find a conversation by userid
 * @param  userId unique id of a user
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching conversation if one exists. Else null is returned
 */
export async function getConversationsByUserId(userId: bigint, useCache: boolean = false): Promise<Conversation[] | null> {
  const includes : Prisma.ConversationInclude = defaultConversationInclude.include;
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetConversations.clear({ members: { some: { id: userId } } }, includes); 
  }
  return memoizedGetConversations({ members: { some: { id: userId } } }, includes);
}

/**
 * Find a conversation by id
 * @param  username unique username
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching conversation if one exists. Else null is returned
 */
export async function getConversationsByUsername(username: string, useCache: boolean = false): Promise<Conversation[] | null> {
  const includes : Prisma.ConversationInclude = defaultConversationInclude.include;
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetConversations.clear({ members: { some: { username } } }, includes); 
  }
  return memoizedGetConversations({ members: { some: { username } } }, includes);
}

/**
 * Create a new conversation
 * @param  data data required to create a conversation
 * @return returns newly created conversation.
 */
export async function createConversation(data : Prisma.ConversationCreateInput) {
  const newConversation = await prisma.conversation.create({
    data: data,
  }).catch((e) => console.error(`Failed to create new conversation ${data.name} ${e}`));
  return newConversation;
}

/**
 * add a user from a conversation
 * @param  conversationId
 * @param  userMatch
 * @return returns newly updated conversation.
 */
export async function joinConversation(conversationId: bigint, userMatch: Prisma.UserWhereUniqueInput) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: {
      members: { 
        connect: userMatch,
      },
    },
  }).catch((e) => console.error(`Failed to join conversation ${conversationId} ${e}`));

}

/**
 * remove a user from a conversation
 * @param  conversationId
 * @param  userMatch
 * @return returns newly updated conversation.
 */
export async function leaveConversation(conversationId: bigint, userMatch: Prisma.UserWhereUniqueInput) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: {
      members: { 
        disconnect: userMatch,
      },
    },
  }).catch((e) => console.error(`Failed to join conversation ${conversationId} ${e}`));

}

/**
 * Create a new conversation
 * @param  id id of conversation to update
 * @param  update data required to update conversation
 * @return returns newly updated conversation.
 */
export async function updateConversation(id: bigint, update: Prisma.ConversationUpdateInput) {
  const updated = await prisma.conversation.update({
    where: { id },
    data: update,
  }).catch(() => console.error(`Failed to update conversation ${id}`));
  return updated;
}

/**
 * Remove a conversation entry by id
 * @param  id id of conversation to update
 * @return removed conversation
 */
export async function deleteConversation(id: bigint) {
  return prisma.conversation.delete({ where: { id } });
}