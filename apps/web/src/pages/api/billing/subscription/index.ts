// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { Billing, Prisma } from '@prisma/client';
import { BillingWithAll, getBillingByUserId } from '@src/api2/billing';
import { upsertSubscription } from '@src/api2/subscription';
import { getUserByAuthId } from '@src/api2/user';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { createStripeSubscription, removeStripeSubscription } from '@src/lib/stripe';
import HttpStatus from 'http-status-codes';
import { resolve } from 'path';

const handler = createHandler();

handler
  .use(requireAuthMiddleware)
  .get(async (req, res) => {
    const { 
      authId,
    } = req;
    let billing : BillingWithAll | null = null;
    const user = await getUserByAuthId(authId);
    if (user && authId === user?.authId) {
      billing = await getBillingByUserId(user.id);
    } else {
      const errorMessage = "You're not authorized to access this billing information";
      console.error(errorMessage);
      res.status(HttpStatus.UNAUTHORIZED).end(errorMessage);
      resolve();
      return;
    }
    res.json({ billing });
    resolve();
  })
  // POST /api/billing/subscription   Create a new subscription on
  // Stripe and persist a matching Subscription row in Postgres. Body:
  // { priceId, communityId, accountId } where accountId is the
  // creator's connected Stripe account (transfer destination).
  .post(async (req, res) => {
    const user = await getUserByAuthId(req.authId);
    if (!user || req.authId !== user.authId) {
      res.status(HttpStatus.UNAUTHORIZED).end('Not authorized');
      return;
    }
    const billing = await getBillingByUserId(user.id);
    if (!billing?.customer) {
      res.status(HttpStatus.BAD_REQUEST).end('No Stripe customer');
      return;
    }
    const { priceId, communityId, accountId } = req.body as {
      priceId?: string; communityId?: string; accountId?: string;
    };
    if (!priceId || !communityId || !accountId) {
      res.status(HttpStatus.BAD_REQUEST).end('priceId, communityId, accountId required');
      return;
    }
    const stripeSub = await createStripeSubscription(
      billing.customer.customerId,
      priceId,
      accountId,
      communityId,
      user.authId,
    );
    const persisted = await upsertSubscription(stripeSub.id, {
      stripeId: stripeSub.id,
      active: true,
      stripeValue: JSON.stringify(stripeSub),
      community: { connect: { id: BigInt(communityId) } },
      user: { connect: { id: user.id } },
    });
    res.json({ subscription: persisted });
  })
  .put((async (req, res) => {
    const {
      authId,
      body,
    } = req;

    let billing : Billing | null = null;
    const user = await getUserByAuthId(authId);
    if (user && authId === user?.authId) {
      billing = await getBillingByUserId(user.id);
    } else {
      const errorMessage = "You're not authorized to access this billing information";
      console.error(errorMessage);
      res.status(HttpStatus.UNAUTHORIZED).end(errorMessage);
      resolve();
      return;
    }
    res.json({ billing });
    resolve();
  }))
  .delete(async (req, res) => {
    const {
      query: { id, stripeId },
    } = req;
    //TODO make sure it is my sub

    //attempt to delete from stripe
    let removeResult;
    let subId = id ? BigInt(id as string) : undefined;
    if (id) {
      const sub = await prisma.subscription.findUnique({
        where: { id: subId },
      });
      if (sub) {
        removeResult = await removeStripeSubscription(sub.stripeId); 
      } else {
        throw new Error('Cannot find matching subscription');
      }
    } else if (stripeId) {
      removeResult = await removeStripeSubscription(stripeId as string);  
    } else {
      res.status(HttpStatus.BAD_REQUEST);
      return;
    }
    //on success, update in our db
    //TODO prob add some data points like 'cancelled date' or something
    if (removeResult) {
      await prisma.subscription.update({
        where: {
          id: subId, 
          stripeId: (stripeId as string) || undefined,
        },
        data: {
          active: false,
        },
      });
      
    } else {
      throw new Error('Did not remove subscription');
    }
    return res.json(removeResult);
  });

export default handler;