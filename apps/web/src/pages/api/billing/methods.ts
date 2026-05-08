// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { BillingWithAll, getBillingByUserId } from '@src/api2/billing';
import { getUserByAuthId } from '@src/api2/user';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import {
  AttachPaymentMethod,
  detachPaymentMethod,
  getPaymentMethods,
  setDefaultSource,
} from '@src/lib/stripe';
import HttpStatus from 'http-status-codes';
import { resolve } from 'path';
import Stripe from 'stripe';

// Helper: resolve the authenticated user's Stripe customer id, or
// short-circuit with a 4xx and return null if anything is missing.
async function resolveCustomerId(req, res): Promise<string | null> {
  const user = await getUserByAuthId(req.authId);
  if (!user || req.authId !== user.authId) {
    res.status(HttpStatus.UNAUTHORIZED).end('Not authorized');
    return null;
  }
  const billing = await getBillingByUserId(user.id);
  if (!billing) {
    res.status(HttpStatus.NOT_FOUND).end('No billing record');
    return null;
  }
  if (!billing.customer) {
    res.status(HttpStatus.BAD_REQUEST).end('No Stripe customer — POST /api/billing/customer first');
    return null;
  }
  return billing.customer.customerId;
}

const handler = createHandler();

handler
  .use(requireAuthMiddleware)
  .get(async (req, res) => {
    const customerId = await resolveCustomerId(req, res);
    if (!customerId) return;
    const fromStripe = await getPaymentMethods(customerId, 'card');
    res.json({ methods: fromStripe.data as Stripe.PaymentMethod[] });
  })
  // POST /api/billing/methods   Attach a payment method to the user's
  // Stripe customer. Body: { sourceId: string } where sourceId is a
  // Stripe source / payment-method id minted client-side via Stripe
  // Elements (createSource / createPaymentMethod). The handler also
  // promotes the new method to default so it appears as the active
  // card immediately.
  .post(async (req, res) => {
    const customerId = await resolveCustomerId(req, res);
    if (!customerId) return;
    const sourceId = req.body?.sourceId as string | undefined;
    if (!sourceId) {
      res.status(HttpStatus.BAD_REQUEST).end('sourceId is required');
      return;
    }
    await AttachPaymentMethod(customerId, sourceId);
    res.json({ ok: true });
  })
  // PUT /api/billing/methods   Set default payment source.
  .put(async (req, res) => {
    const customerId = await resolveCustomerId(req, res);
    if (!customerId) return;
    const sourceId = req.body?.sourceId as string | undefined;
    if (!sourceId) {
      res.status(HttpStatus.BAD_REQUEST).end('sourceId is required');
      return;
    }
    await setDefaultSource(customerId, sourceId);
    res.json({ ok: true });
  })
  // DELETE /api/billing/methods?id=<paymentMethodId>   Detach.
  .delete(async (req, res) => {
    const customerId = await resolveCustomerId(req, res);
    if (!customerId) return;
    const id = req.query.id as string | undefined;
    if (!id) {
      res.status(HttpStatus.BAD_REQUEST).end('id is required');
      return;
    }
    await detachPaymentMethod(id);
    res.json({ ok: true });
  });

export default handler;