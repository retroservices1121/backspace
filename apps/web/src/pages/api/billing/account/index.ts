// Creator-side account flows. Counterpart to /api/billing/customer
// for the *payee* side: this is the Stripe Connect Express account
// that receives subscription transfers.
//
//   POST   /api/billing/account
//     Idempotent. Creates a Stripe Express account for the
//     authenticated user if one doesn't exist, persists it on
//     Billing.account, then returns the account plus a fresh
//     onboarding AccountLink. Body is optional: { fName?, lName?,
//     dob? } populate the Stripe individual record so the user has
//     less to fill in inside Stripe's hosted flow.
//
//   GET    /api/billing/account
//     Returns the live Stripe account state plus either an
//     onboarding link (if requirements are still due) or a
//     dashboard login link (once onboarding is complete). The UI
//     decides which button to show based on `requirements`.
//
// Note on authority: identity comes from req.authId. The route
// never reads body.userId or accepts a target user — a creator can
// only create / read their own Stripe account.

import { Prisma } from '@prisma/client';
import { Billing } from '@prisma/client';
import { createBilling, getBillingByUserId } from '@src/api2/billing';
import prisma from '@src/api2/prisma';
import { upsertStripeAccount } from '@src/api2/stripeAccount';
import { getUserByAuthId } from '@src/api2/user';
import createHandler, { requireAuthMiddleware } from '@src/lib/nextconnect';
import {
  CreateAccountLink,
  CreateNewStripeAccount,
  getLoginLink,
  getStripeAccount,
} from '@src/lib/stripe';
import HttpStatus from 'http-status-codes';
import type { NextApiRequest } from 'next';
import Stripe from 'stripe';

const handler = createHandler();

// Origin the onboarding flow comes back to. NEXT_PUBLIC_APP_URL is
// the canonical app origin (set per-environment); fall back to the
// request host so dev "just works" without env config.
function appOrigin(req: NextApiRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const proto = (req.headers['x-forwarded-proto'] as string) || 'http';
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host;
  return `${proto}://${host}`;
}

handler
  .use(requireAuthMiddleware)
  // GET /api/billing/account  Live Stripe account state + a link.
  .get(async (req, res) => {
    const user = await getUserByAuthId(req.authId);
    if (!user) {
      res.status(HttpStatus.NOT_FOUND).end('User not found');
      return;
    }
    const billing = await getBillingByUserId(user.id);
    const account = billing?.account;
    if (!account) {
      res.json({ account: null, link: null, linkType: null });
      return;
    }

    let stripeAccount: Stripe.Account;
    try {
      stripeAccount = await getStripeAccount(account.accountId);
    } catch (err) {
      // If Stripe doesn't recognise the account we stored (deleted on
      // the Stripe side, sandbox mismatch, etc.) the UI should still
      // render — we surface a null account so it falls back to the
      // "create account" state instead of crashing.
      // eslint-disable-next-line no-console
      console.error('getStripeAccount failed', err);
      res.json({ account: null, link: null, linkType: null });
      return;
    }

    const dueRequirements = stripeAccount.requirements?.currently_due ?? [];
    const fullyOnboarded = dueRequirements.length === 0
      && stripeAccount.charges_enabled
      && stripeAccount.payouts_enabled;

    let link: Stripe.AccountLink | Stripe.LoginLink | null = null;
    let linkType: 'onboarding' | 'dashboard' | null = null;
    try {
      if (fullyOnboarded) {
        link = await getLoginLink(account.accountId);
        linkType = 'dashboard';
      } else {
        const origin = appOrigin(req);
        link = await CreateAccountLink(
          account.accountId,
          `${origin}/settings/creator`,
          `${origin}/settings/creator`,
        );
        linkType = 'onboarding';
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('account link creation failed', err);
    }

    res.json({ account: stripeAccount, link, linkType });
  })
  // POST /api/billing/account  Create the Express account (idempotent).
  .post(async (req, res) => {
    const user = await getUserByAuthId(req.authId);
    if (!user) {
      res.status(HttpStatus.NOT_FOUND).end('User not found');
      return;
    }

    let billing: Billing | null = await getBillingByUserId(user.id);
    if (!billing) {
      billing = (await createBilling({ user: { connect: { id: user.id } } })) as Billing;
    }

    const billingWithAccount = await getBillingByUserId(user.id);
    if (billingWithAccount?.account) {
      const stripeAccount = await getStripeAccount(billingWithAccount.account.accountId);
      const origin = appOrigin(req);
      const accountLink = await CreateAccountLink(
        billingWithAccount.account.accountId,
        `${origin}/settings/creator`,
        `${origin}/settings/creator`,
      );
      res.json({ account: stripeAccount, accountLink });
      return;
    }

    const priv = await prisma.private.findUnique({ where: { userId: user.id } });
    const email = priv?.email;
    if (!email) {
      res.status(HttpStatus.BAD_REQUEST).end('User has no email on Private — cannot create Stripe account');
      return;
    }

    const body = (req.body ?? {}) as {
      fName?: string;
      lName?: string;
      dob?: { month: number; day: number; year: number };
    };

    const stripeAccount = await CreateNewStripeAccount(
      user.authId,
      email,
      user.name || user.authId,
      body.fName,
      body.lName,
      body.dob as any,
    );

    await upsertStripeAccount(stripeAccount.id, {
      accountId: stripeAccount.id,
      stripeValue: stripeAccount as unknown as Prisma.InputJsonValue,
      billing: { connect: { id: billing!.id } },
    });

    const origin = appOrigin(req);
    const accountLink = await CreateAccountLink(
      stripeAccount.id,
      `${origin}/settings/creator`,
      `${origin}/settings/creator`,
    );

    res.json({ account: stripeAccount, accountLink });
  });

export default handler;
