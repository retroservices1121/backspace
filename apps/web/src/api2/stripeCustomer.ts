// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Prisma, StripeCustomer } from '@prisma/client';

import prisma from './prisma';
/**
 * Get a stripeCustomer table from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a user
 * @param  include optional relational fields to grab
 * @return unique matching user if one exists. Else null is returned
 */
export async function getStripeCustomer(
  uniqueField: Prisma.StripeCustomerWhereUniqueInput, 
  include : any = undefined) : Promise<StripeCustomer | null> {
  const request : Prisma.StripeCustomerFindUniqueArgs = { where: uniqueField, include };
  const matchedUser = await prisma.stripeCustomer.findUnique(request);
  return matchedUser ;
}

/**
 * Find a stripeCustomer by id
 * @param  customerId unique id of stripeCustomer
 * @param  useCache whether a cached version of the request is okay
 * @return unique matching stripeCustomer if one exists. Else null is returned
 */
export async function getStripeCustomerByCustomerId(customerId: string): Promise<StripeCustomer | null> {
  const includes : Prisma.StripeCustomerInclude = {};
  return getStripeCustomer({ customerId }, includes);
}

/**
 * Create a new stripeCustomer
 * @param  data data required to create a stripeCustomer
 * @return returns newly created stripeCustomer.
 */
export async function createStripeCustomer(data : Prisma.StripeCustomerCreateInput) {
  const newStripeCustomer = await prisma.stripeCustomer.create({
    data: data,
  }).catch(() => console.error(`Failed to create new stripeCustomer ${data.id}`));
  return newStripeCustomer;
}

/**
 * Create a new stripeCustomer
 * @param  id id of stripeCustomer to update
 * @param  update data required to update stripeCustomer
 * @return returns newly updated stripeCustomer.
 */
export async function updateStripeCustomer(id: bigint, update: Prisma.StripeCustomerUpdateInput) {
  const updated = await prisma.stripeCustomer.update({
    where: { id },
    data: update,
  }).catch(() => console.error(`Failed to update stripeCustomer ${id}`));
  return updated;
}

/**
 * Create or update a new stripeCustomer
 * @param  customerId unique stripe customer id
 * @param  data data required to create a stripeCustomer
 * @return returns newly updated/created stripeCustomer.
 */
export async function upsertStripeCustomer(customerId: string, data : Prisma.StripeCustomerCreateInput) {
  const upsertedStripeCustomer = await prisma.stripeCustomer.upsert({
    where: { customerId },
    create: data,
    update: data,
  }).catch((e) => console.error(`Failed to upsert new stripeCustomer ${customerId} ${e}`));
  return upsertedStripeCustomer;
}

/**
 * Remove a stripeCustomer entry by id
 * @param  id id of stripeCustomer to update
 * @return removed stripeCustomer
 */
export async function deleteStripeCustomer(id: bigint) {
  return prisma.stripeCustomer.delete({ where: { id } });
}