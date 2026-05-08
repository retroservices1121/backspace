// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { BillingWithAll, getBillingByUserId } from '@src/api2/billing';
import { getUserByAuthId } from '@src/api2/user';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { getPaymentMethods } from '@src/lib/stripe';
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
    let methods : any[] | null = null;
    const user = await getUserByAuthId(authId);
    if (user && authId === user?.authId) {
      const billing = await getBillingByUserId(user.id);
      if (!billing) {
        res.status(HttpStatus.NOT_FOUND).end();
        resolve();
        return;
      } else if (billing.customer) {
        const fromStripe = await getPaymentMethods(billing.customer.customerId, 'card');
        methods = fromStripe.data;
      }
      
    } else {
      const errorMessage = "You're not authorized to access this billing information";
      console.error(errorMessage);
      res.status(HttpStatus.UNAUTHORIZED).end(errorMessage);
      resolve();
      return;
    }
    res.json({ methods });
    resolve();
  });

export default handler;