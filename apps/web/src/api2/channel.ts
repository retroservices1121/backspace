// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Channel, Prisma } from '@prisma/client';

import { Response } from 'types/utilityTypes';
import memoize from 'utils/memo';

import prisma from './prisma';

export const memoizedGetChannel = memoize(getChannel);
export const memoizedGetChannels = memoize(getChannels);

/**
 * Get a channel from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a channel
 * @param  include optional relational fields to grab
 * @return unique matching channel if one exists. Else null is returned
 */
export async function getChannel(
  uniqueField: Prisma.ChannelWhereUniqueInput, 
  include? : Prisma.ChannelInclude) : Promise<Channel | null> {
  const request : Prisma.ChannelFindUniqueArgs = { where: uniqueField, include };
  const matchedChannel = await prisma.channel.findUnique(request);
  return matchedChannel ;
}

/**
 * Get a channel from the database. This function often is wrapped with a simplified call
 * @param  searchField unique criteria that identifies a channel
 * @param  include optional relational fields to grab
 * @return unique matching channel if one exists. Else null is returned
 */
export async function getChannels(
  searchField: Prisma.ChannelWhereInput, 
  include? : Prisma.ChannelInclude) : Promise<Channel[] | null> {
  const request : Prisma.ChannelFindManyArgs = { where: searchField, include };
  const matchedChannels = await prisma.channel.findMany(request);
  return matchedChannels;
}

export async function createChannel(channelData : Prisma.ChannelCreateInput) {
  return await prisma.channel.create({
    data: channelData,
  }).catch((e) => console.error(`Failed to create new channel ${channelData.community.connect.id}\n${e}`)) || null;
}

export async function updateChannel(id: bigint, channelData: Prisma.ChannelUpdateInput) {
  return await prisma.channel.update({
    where: { id },
    data: channelData,
  }).catch((e) => console.error(`Failed to update channel ${id}\n${e}`)) || null;
}

/**
 * Remove a channel entry by id
 * @param  id id of channel to update
 * @return removed channel
 */
export async function deleteChannel(id: bigint) {
  return prisma.channel.delete({ where: { id } });
}

const getChannelByIdIncludes = { messages: { include: { author: true } } };
const getChannelByIdResponse = Prisma.validator<Prisma.ChannelArgs>()({ include: getChannelByIdIncludes });

export async function getChannelById(id: bigint): Promise<Prisma.ChannelGetPayload<typeof getChannelByIdResponse>> {
  const matchedChannel = await prisma.channel.findUnique({
    where: { id },
    include: { messages: { include: { author: true } } },
  });
  return matchedChannel;
}

export type GetChannelById = Response<typeof getChannelById>;
