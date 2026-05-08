// POST /api/webhooks/stripe
//
// Stripe webhook receiver. Set the endpoint URL on the Stripe
// dashboard, copy the signing secret into STRIPE_WEBHOOK_SECRET.
// We currently care about:
//   - account.updated: keep StripeAccount.stripeValue fresh so
//     /settings/creator stops needing manual refresh after the
//     creator finishes onboarding.
//   - customer.subscription.{updated,deleted}: keep our local
//     Subscription row's `active` flag honest when Stripe cancels
//     a subscription on its own (failed payment, etc.).
// Anything else gets logged and 200'd so Stripe doesn't retry.
//
// This route MUST receive the raw body (signature verification
// hashes the bytes) so we disable the default JSON body parser.

import type { NextApiRequest, NextApiResponse } from 'next';
import type { Prisma } from '@prisma/client';
import Stripe from 'stripe';
import prisma from '@src/api2/prisma';
import { stripe } from '@src/lib/stripe';

export const config = {
  api: { bodyParser: false },
};

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return Buffer.concat(chunks);
}

async function handleAccountUpdated(account: Stripe.Account) {
  // Match by accountId — Stripe Connect IDs are globally unique.
  const existing = await prisma.stripeAccount.findUnique({
    where: { accountId: account.id },
    select: { id: true },
  });
  if (!existing) {
    // We've heard about an account we don't track — probably a
    // platform-level sandbox quirk or pre-DB account. Log and skip.
    // eslint-disable-next-line no-console
    console.warn('account.updated for unknown accountId', account.id);
    return;
  }
  await prisma.stripeAccount.update({
    where: { id: existing.id },
    data: { stripeValue: account as unknown as Prisma.InputJsonValue },
  });
}

async function handleSubscriptionEvent(sub: Stripe.Subscription) {
  // Stripe will emit deleted when a subscription is canceled and
  // also a final updated with status='canceled'. We treat any
  // non-active state as inactive locally; the full Stripe object
  // is preserved on stripeValue for reporting.
  const active = sub.status === 'active' || sub.status === 'trialing';
  try {
    await prisma.subscription.update({
      where: { stripeId: sub.id },
      data: {
        active,
        stripeValue: JSON.stringify(sub),
      },
    });
  } catch (err) {
    // Subscription not found locally — could be a Stripe-side test
    // event or one that predates our row. Don't 500 the webhook.
    // eslint-disable-next-line no-console
    console.warn('subscription event for unknown stripeId', sub.id, err);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method not allowed');
    return;
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    res.status(503).end('STRIPE_WEBHOOK_SECRET not configured');
    return;
  }

  const sig = req.headers['stripe-signature'];
  if (typeof sig !== 'string') {
    res.status(400).end('Missing stripe-signature header');
    return;
  }

  let raw: Buffer;
  try {
    raw = await readRawBody(req);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to read raw body', err);
    res.status(400).end('Bad request body');
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Stripe signature verification failed', err);
    res.status(400).end('Invalid signature');
    return;
  }

  try {
    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
        break;
      default:
        // Log unhandled events at debug; Stripe sends a lot of types
        // we don't care about. Returning 200 prevents retry storms.
        // eslint-disable-next-line no-console
        console.debug('Unhandled Stripe event', event.type);
    }
    res.json({ received: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Stripe webhook handler error', err);
    // Return 500 so Stripe retries; transient DB errors are the
    // typical cause and a retry usually succeeds.
    res.status(500).end(err instanceof Error ? err.message : 'Handler error');
  }
}
