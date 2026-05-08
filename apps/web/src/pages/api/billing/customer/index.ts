// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { Prisma } from '@prisma/client';
import { BillingWithAll, createBilling, getBillingByUserId } from '@src/api2/billing';
import { upsertStripeCustomer } from '@src/api2/stripeCustomer';
import { getUserByAuthId } from '@src/api2/user';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import { CreateNewStripeCustomer } from '@src/lib/stripe';
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
  // POST /api/billing/customer  Create a Stripe customer for the
  // authenticated user. Idempotent: if a customer already exists on the
  // user's Billing row we return it instead of creating a duplicate.
  // Identity from req.authId; no body required (email/name come off
  // the User+Private rows we already have server-side).
  .post(async (req, res) => {
    const user = await getUserByAuthId(req.authId);
    if (!user) {
      res.status(HttpStatus.NOT_FOUND).end('User not found');
      return;
    }
    let billing = await getBillingByUserId(user.id);
    if (!billing) {
      billing = await createBilling({ user: { connect: { id: user.id } } });
    }
    if (billing?.customer) {
      res.json({ billing });
      return;
    }
    const priv = await prisma.private.findUnique({ where: { userId: user.id } });
    const email = priv?.email;
    if (!email) {
      res.status(HttpStatus.BAD_REQUEST).end('User has no email on Private — cannot create Stripe customer');
      return;
    }
    const stripeCustomer = await CreateNewStripeCustomer(
      user.authId,
      email,
      user.name || undefined,
      priv?.phone || undefined,
    );
    await upsertStripeCustomer(stripeCustomer.id, {
      customerId: stripeCustomer.id,
      stripeValue: stripeCustomer as unknown as Prisma.InputJsonValue,
      billing: { connect: { id: billing!.id } },
    });
    const refreshed = await getBillingByUserId(user.id, false);
    res.json({ billing: refreshed });
  });

export default handler;