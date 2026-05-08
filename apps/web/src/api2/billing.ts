// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Prisma } from '@prisma/client';

import memoize from 'utils/memo';

import prisma from './prisma';

//Internal memoized billing instance
const memoizedGetBilling = memoize(getBilling);

const billingWithAllArgs = Prisma.validator<Prisma.BillingArgs>()({
  include: {
    customer: true,
    account: true,
  },
});

export type BillingWithAll = Prisma.BillingGetPayload<typeof billingWithAllArgs>;

/**
 * Get a billing table from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a user
 * @param  include optional relational fields to grab
 * @return unique matching user if one exists. Else null is returned
 */
export async function getBilling(
  uniqueField: Prisma.BillingWhereUniqueInput, 
  include : Prisma.BillingInclude = undefined) {
  const request : Prisma.BillingFindUniqueArgs = { where: uniqueField, include };
  const matchedUser = await prisma.billing.findUnique(request);
  return matchedUser ;
}

/**
 * Find a billing by id
 * @param  id unique id of billing
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching billing if one exists. Else null is returned
 */
export async function getBillingById(id: bigint, useCache: boolean = false): Promise<BillingWithAll | null> {
  const includes : Prisma.BillingInclude = billingWithAllArgs.include;
  if (!useCache) { //Clear memoized user using arguments
    memoizedGetBilling.clear({ id }, includes); 
  }
  return (await memoizedGetBilling({ id }, includes)) as BillingWithAll;
}

/**
 * Find a billing by userId
 * @param  userId unique id of the user
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching billing if one exists. Else null is returned
 */
export async function getBillingByUserId(userId: bigint, useCache: boolean = false): Promise<BillingWithAll | null> {
  const includes : Prisma.BillingInclude = billingWithAllArgs.include;

  if (!useCache) { //Clear memoized user using arguments
    memoizedGetBilling.clear({ userId }, includes); 
  }
  return (await memoizedGetBilling({ userId }, includes)) as BillingWithAll;
}


/**
 * Create a new billing
 * @param  data data required to create a billing
 * @return returns newly created billing.
 */
export async function createBilling(data : Prisma.BillingCreateInput) {
  const newBilling = await prisma.billing.create({
    data: data,
  }).catch(() => console.error(`Failed to create new billing ${data.account}`));
  return newBilling;
}

/**
 * Create a new billing
 * @param  id id of billing to update
 * @param  update data required to update billing
 * @return returns newly updated billing.
 */
export async function updateBilling(id: bigint, update: Prisma.BillingUpdateInput) {
  const updated = await prisma.billing.update({
    where: { id },
    data: update,
  }).catch(() => console.error(`Failed to update billing ${id}`));
  return updated;
}

/**
 * Remove a billing entry by id
 * @param  id id of billing to update
 * @return removed billing
 */
export async function deleteBilling(id: bigint) {
  return prisma.billing.delete({ where: { id } });
}
