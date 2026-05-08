// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { Billing, Prisma } from '@prisma/client';
import { BillingWithAll, getBillingByUserId } from '@src/api2/billing';
import { getCommunitiesByAuthId, getCommunity } from '@src/api2/community';
import { upsertSubscription } from '@src/api2/subscription';
import { getUserByAuthId } from '@src/api2/user';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { getAllSubscriptions, getPlatformSubscriptions } from '@src/lib/stripe';
import chalk from 'chalk';
import HttpStatus from 'http-status-codes';
import { resolve } from 'path';
import Stripe from 'stripe';

const handler = createHandler();

handler
  .all(async (req, res) => {
    const {
      query: { id },
    } = req;
    let findMany : Prisma.SubscriptionFindManyArgs = undefined;
    if (id) {
      findMany = {
        where: {
          userId: BigInt(id as string),
        },
      };
    }
    //Track that a sub was updated (false = not updated)
    const subMap = new Map<string, boolean>();
    //TODO probably only does 1000 records in this request
    const currentFromDB = await prisma.subscription.findMany(findMany);
    for (const sub of currentFromDB) {
      subMap.set(sub.stripeId, false);
    }

    let temp; 
    if (id) {
      const userWithCustomer = await prisma.user.findUnique({
        where: { id: BigInt(id as string) },
        include: { billing: { include: { customer: true } } },
      });
      // @ts-ignore
      temp = userWithCustomer.billing?.customer.customerId ? await getAllSubscriptions(userWithCustomer.billing.customer.customerId) : [];
    } else {
      temp = await getPlatformSubscriptions();
    }
    const allSubscriptions = temp?.data as Stripe.Subscription[];
    try {
      if (allSubscriptions && allSubscriptions.length > 0) {
        const uniqueness = new Map<string, string>();
        allSubscriptions.sort((a, b) => {
          if (a.created > b.created) return 1;
          else if (a.created < b.created) return -1;
          else return 0;
        });
        for (const sub of allSubscriptions) {
          subMap.set(sub.id, true);
          //find user
          const foundUser = sub.metadata.uid ? await getUserByAuthId(sub.metadata.uid) : undefined;
          const userId = foundUser?.id;
          //find community
          const foundCommunity = sub.metadata.community ? await getCommunity({ fbid: sub.metadata.community }) : undefined;
          const communityId = foundCommunity?.id;
          if (userId && communityId) {
            const mapKey = `${userId}${communityId}`;
            const check = uniqueness.get(mapKey);
            if (check) {
              console.warn(chalk.red('duplicate subscriptions!!!') + `\n${userId} & ${communityId}\n${sub.id}\n${check}`);
            }
            uniqueness.set(mapKey, sub.id);
            const newSubscription : Prisma.SubscriptionCreateInput = {
              stripeId: sub.id,
              active: true,
              stripeValue: JSON.stringify(sub),
              community: {
                connect: {
                  id: communityId,
                },
              },
              user: {
                connect: {
                  id: userId,
                },
              },
            };
            await upsertSubscription(sub.id, newSubscription ); 
          } else {
            console.warn(`missing required data for subscription clone\n${userId}${communityId}`);
          }
          // Any sub in our DB that didn't come from Stripe, mark it as inactive
          for (const stripeId in subMap) {
            if (Object.prototype.hasOwnProperty.call(subMap, stripeId)) {
              const updated = subMap[stripeId];
              if (updated === false) {
                await prisma.subscription.update({
                  where: { stripeId },
                  data: {
                    active: false,
                  },
                });
              }
            }
          }

        }
        console.log('Done syncing subscriptions');
      } else {
        console.warn('No Subscriptoins???');
      }
    } catch (error) {
      console.error(error);
      throw error;
      
    }


    res.status(200);
    resolve();
  });

export default handler;