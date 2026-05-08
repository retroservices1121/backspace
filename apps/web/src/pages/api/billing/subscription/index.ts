// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { Billing } from '@prisma/client';
import { BillingWithAll, getBillingByUserId } from '@src/api2/billing';
import { getUserByAuthId } from '@src/api2/user';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { removeStripeSubscription } from '@src/lib/stripe';
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