// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Prisma, StripeAccount } from '@prisma/client';

import prisma from './prisma';
/**
 * Get a stripeAccount table from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a user
 * @param  include optional relational fields to grab
 * @return unique matching user if one exists. Else null is returned
 */
export async function getStripeAccount(
  uniqueField: Prisma.StripeAccountWhereUniqueInput, 
  include : any = undefined) : Promise<StripeAccount | null> {
  const request : Prisma.StripeAccountFindUniqueArgs = { where: uniqueField, include };
  const matchedUser = await prisma.stripeAccount.findUnique(request);
  return matchedUser ;
}

/**
 * Find a stripeAccount by id
 * @param  id unique id of stripeAccount
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching stripeAccount if one exists. Else null is returned
 */
export async function getStripeAccountByAccountId(accountId: string): Promise<StripeAccount | null> {
  const includes : Prisma.StripeAccountInclude = {};
  return getStripeAccount({ accountId }, includes);
}

/**
 * Create a new stripeAccount
 * @param  data data required to create a stripeAccount
 * @return returns newly created stripeAccount.
 */
export async function createStripeAccount(data : Prisma.StripeAccountCreateInput) {
  const newStripeAccount = await prisma.stripeAccount.create({
    data: data,
  }).catch(() => console.error(`Failed to create new stripeAccount ${data.id}`));
  return newStripeAccount;
}

/**
 * Create a new stripeAccount
 * @param  id id of stripeAccount to update
 * @param  update data required to update stripeAccount
 * @return returns newly updated stripeAccount.
 */
export async function updateStripeAccount(id: bigint, update: Prisma.StripeAccountUpdateInput) {
  const updated = await prisma.stripeAccount.update({
    where: { id },
    data: update,
  }).catch(() => console.error(`Failed to update stripeAccount ${id}`));
  return updated;
}

/**
 * Create or update a new stripeAccount
 * @param  accountId unique stripe account id
 * @param  data data required to create a stripeAccount
 * @return returns newly updated/created stripeAccount.
 */
export async function upsertStripeAccount(accountId: string, data : Prisma.StripeAccountCreateInput) {
  const upsertedStripeAccount = await prisma.stripeAccount.upsert({
    where: { accountId },
    create: data,
    update: data,
  }).catch((e) => console.error(`Failed to upsert new stripeAccount ${accountId} ${e}`));
  return upsertedStripeAccount;
}

/**
 * Remove a stripeAccount entry by id
 * @param  id id of stripeAccount to update
 * @return removed stripeAccount
 */
export async function deleteStripeAccount(id: bigint) {
  return prisma.stripeAccount.delete({ where: { id } });
}