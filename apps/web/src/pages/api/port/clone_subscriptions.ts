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
import { getPlatformSubscriptions } from '@src/lib/stripe';
import chalk from 'chalk';
import HttpStatus from 'http-status-codes';
import { resolve } from 'path';
import Stripe from 'stripe';

const handler = createHandler();

handler
  .all(async (req, res) => {
    

    const temp = await getPlatformSubscriptions();
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
              continue;
            } else {
              uniqueness.set(mapKey, sub.id);
            }
            const newSubscription : Prisma.SubscriptionCreateInput = {
              stripeId: sub.id,
              active: true,
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
            upsertSubscription(sub.id, newSubscription ); 
          } else {
            console.warn(`missing required data for subscription clone\n${userId}${communityId}`);
          }
          
        }
        console.log('Done cloning subscriptions');
      }
    } catch (error) {
      console.error(error);
    }


    res.status(200);
    resolve();
  });

export default handler;