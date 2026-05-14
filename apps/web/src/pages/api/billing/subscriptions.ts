// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import prisma from '@src/api2/prisma';
import { Prisma, Subscription } from '@prisma/client';
import { BillingWithAll, getBillingByUserId } from '@src/api2/billing';
import { getCommunitiesByFbid } from '@src/api2/community';
import { getUserByAuthId } from '@src/api2/user';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { getAllSubscriptions, getPaymentMethods } from '@src/lib/stripe';
import { SubscriptionWithCommunity } from '@src/types/billing';
import HttpStatus from 'http-status-codes';
import { resolve } from 'path';
import Stripe from 'stripe';

const handler = createHandler();

handler
  .use(requireAuthMiddleware)
  .get(async (req, res) => {
    const { 
      authId,
    } = req;
    let subscriptions : Subscription[] | null = null;
    const user = await getUserByAuthId(authId);
    if (user && authId === user?.authId) {
      subscriptions = await prisma.subscription.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          stripeId: Prisma.SortOrder.desc,
        },
        include: {
          community: {
            include: {
              avatar: true,
            },
          },
        },
      });
      
    } else {
      const errorMessage = "You're not authorized to access this billing information";
      console.error(errorMessage);
      res.status(HttpStatus.UNAUTHORIZED).end(errorMessage);
      resolve();
      return;
    }
    return res.json(subscriptions);
  });

export default handler;

//Dylan didn't want to lose this implementation, delete later

// // Copyright 2022 NewSocial Inc. - All Rights Reserved
// // Unauthorized copying of this file, via any medium is strictly prohibited
// // Proprietary and confidential
// // Author(s): See Git History


// import { BillingWithAll, getBillingByUserId } from '@src/api2/billing';
// import { getCommunitiesByFbid } from '@src/api2/community';
// import { getUserByAuthId } from '@src/api2/user';
// import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
// import { getAllSubscriptions, getPaymentMethods } from '@src/lib/stripe';
// import { SubscriptionWithCommunity } from '@src/types/billing';
// import HttpStatus from 'http-status-codes';
// import { resolve } from 'path';
// import Stripe from 'stripe';

// const handler = createHandler();

// handler
//   .use(requireAuthMiddleware)
//   .get(async (req, res) => {
//     const { 
//       authId,
//     } = req;
//     let subscriptions : SubscriptionWithCommunity[] | null = null;
//     const user = await getUserByAuthId(authId);
//     if (user && authId === user?.authId) {
//       const billing = await getBillingByUserId(user.id);
//       if (!billing) {
//         res.status(HttpStatus.NOT_FOUND).end();
//         resolve();
//         return;
//       } else if (billing.customer) {
//         const fromStripe = await getAllSubscriptions(billing.customer.customerId);
//         subscriptions = fromStripe.data;
//       }
//       if (subscriptions) {
//         const value = subscriptions.map(async (sub) => {
//           const temp : SubscriptionWithCommunity = {
//             ...sub,
//             community: sub.metadata?.community ? await getCommunitiesByFbid(sub.metadata.community as string, true) : undefined,
//             ownerAuthId: sub.metadata?.uid || undefined,
//           };
//           return temp;
//         });
//         await Promise.all(value).then((result) => subscriptions = result);
//       }
//     } else {
//       const errorMessage = "You're not authorized to access this billing information";
//       console.error(errorMessage);
//       res.status(HttpStatus.UNAUTHORIZED).end(errorMessage);
//       resolve();
//       return;
//     }
//     return res.json(subscriptions);
//   });

// export default handler;