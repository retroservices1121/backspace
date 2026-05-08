// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Member, Prisma } from '@prisma/client';
import memoize from 'utils/memo';

import prisma from './prisma';

export const memoizedGetMember = memoize(getMember);
export const memoizedGetMembers = memoize(getMembers);

/**
 * Get a member from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a member
 * @param  include optional relational fields to grab
 * @return unique matching member if one exists. Else null is returned
 */
export async function getMember(
  uniqueField: Prisma.MemberWhereUniqueInput, 
  include? : Prisma.MemberInclude) : Promise<Member | null> {
  const request : Prisma.MemberFindUniqueArgs = { where: uniqueField, include };
  const matchedMember = await prisma.member.findUnique(request);
  return matchedMember ;
}

/**
 * Get a member from the database. This function often is wrapped with a simplified call
 * @param  searchField unique criteria that identifies a member
 * @param  include optional relational fields to grab
 * @return unique matching member if one exists. Else null is returned
 */
export async function getMembers(
  searchField: Prisma.MemberWhereInput, 
  include? : Prisma.MemberInclude) : Promise<Member[] | null> {
  const request : Prisma.MemberFindManyArgs = { where: searchField, include };
  const matchedMembers = await prisma.member.findMany(request);
  return matchedMembers;
}

export async function createMember(memberData : Prisma.MemberCreateInput) {
  return await prisma.member.create({
    data: memberData,
  }).catch((e) => console.error(`Failed to create new member ${memberData.community.connect.id}\n${e}`)) || null;
}

export async function updateMember(id: bigint, memberData: Prisma.MemberUpdateInput) {
  return await prisma.member.update({
    where: { id },
    data: memberData,
  }).catch((e) => console.error(`Failed to update member ${id}\n${e}`)) || null;
}

/**
 * Remove a member entry by id
 * @param  id id of member to update
 * @return removed member
 */
export async function deleteMember(id: bigint) {
  return prisma.member.delete({ where: { id } });
}