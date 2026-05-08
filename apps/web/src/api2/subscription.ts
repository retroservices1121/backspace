// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Prisma, Subscription } from '@prisma/client';

import prisma from './prisma';


const subscriptionIncludeAll = Prisma.validator<Prisma.SubscriptionArgs>()({
  include: {
    community: true,
    user: true,
  },
});

export type SubscriptionWithRelations = Prisma.SubscriptionGetPayload<typeof subscriptionIncludeAll>;


/**
 * Get a subscription table from the database. This function often is wrapped with a simplified call
 * @param  uniqueField unique criteria that identifies a user
 * @param  include optional relational fields to grab
 * @return unique matching user if one exists. Else null is returned
 */
export async function getSubscription(
  uniqueField: Prisma.SubscriptionWhereUniqueInput, 
  include : any = undefined) : Promise<Subscription | null> {
  const request : Prisma.SubscriptionFindUniqueArgs = { where: uniqueField, include };
  const matchedUser = await prisma.subscription.findUnique(request);
  return matchedUser ;
}

/**
 * Find a subscription by id
 * @param  id unique id of subscription
 * @return unique matching subscription if one exists. Else null is returned
 */
export async function getSubscriptionById(id: bigint): Promise<Subscription | null> {
  const includes : Prisma.SubscriptionInclude = subscriptionIncludeAll.include;
  return getSubscription({ id }, includes);
}

/**
 * Create a new subscription
 * @param  data data required to create a subscription
 * @return returns newly created subscription.
 */
export async function createSubscription(data : Prisma.SubscriptionCreateInput) {
  const newSubscription = await prisma.subscription.create({
    data: data,
  }).catch(() => console.error(`Failed to create new subscription ${data.id}`));
  return newSubscription;
}

/**
 * Create a new subscription
 * @param  id id of subscription to update
 * @param  update data required to update subscription
 * @return returns newly updated subscription.
 */
export async function updateSubscription(id: bigint, update: Prisma.SubscriptionUpdateInput) {
  const updated = await prisma.subscription.update({
    where: { id },
    data: update,
  }).catch(() => console.error(`Failed to update subscription ${id}`));
  return updated;
}

/**
 * Create or update a new subscription
 * @param stripeId stripe subscription id
 * @param  data data required to create a subscription
 * @return returns newly updated/created subscription.
 */
export async function upsertSubscription(stripeId: string, data : Prisma.SubscriptionCreateInput) {
  const upsertedSubscription = await prisma.subscription.upsert({
    where: { stripeId },
    create: data,
    update: data,
  }).catch((e) => console.error(`Failed to upsert new subscription ${stripeId} ${e}`));
  return upsertedSubscription;
}

/**
 * Remove a subscription entry by id
 * @param  id id of subscription to update
 * @return removed subscription
 */
export async function deleteSubscription(id: bigint) {
  return prisma.subscription.delete({ where: { id } });
}