// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { Billing } from '@prisma/client';
import { BillingWithAll, getBillingByUserId } from '@src/api2/billing';
import { getUserByAuthId } from '@src/api2/user';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
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
  }));

export default handler;