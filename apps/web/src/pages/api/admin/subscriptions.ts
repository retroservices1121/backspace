// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { BillingWithAll, getBillingByUserId } from '@src/api2/billing';
import { getUserByAuthId } from '@src/api2/user';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { getAllSubscriptions, getPaymentMethods, getPlatformSubscriptions } from '@src/lib/stripe';
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
    //FIXME add admin check
    let subscriptions : Stripe.Subscription[] | null = null;
    const fromStripe = await getPlatformSubscriptions();
    subscriptions = fromStripe.data;
    res.json({ subscriptions });
    resolve();
  });

export default handler;
