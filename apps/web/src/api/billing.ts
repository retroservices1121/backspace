// Stripe billing client. Replaced the Firebase Cloud Functions surface
// (httpsCallable for ~17 functions) with calls into our own
// pages/api/billing/* routes — those routes use lib/stripe (server-side
// Stripe SDK) and api2/* (Postgres) directly, so this file becomes a
// thin axios wrapper.
//
// User-side (customer flows) is fully wired:
//   getStripeCustomer / createNewStripeCustomer / getStripeCards /
//   deletePayment / setDefaultPayment / getAllSubscriptions /
//   createSubscription / cancelSubscription / addSourceToCustomer
//
// Creator-side (Express accounts, payouts, tier prices) is stubbed —
// the underlying server-side handlers don't exist yet. Calls toast and
// return null. /settings/creator already handles the no-account state
// gracefully so the page renders without exploding.
import { toast } from 'react-toastify';
import Stripe from 'stripe';

import axios from '@src/lib/axios';
import logEvent, { EventMessages } from 'lib/events';
import { CommunityDocument } from 'types/documents';

import { CommunityUnion } from './communityAPI';

export type SubscriptionUnion = Stripe.Subscription & {
  community: CommunityDocument | CommunityUnion,
};

const creatorTodo = (label: string) => {
  toast.info(`${label} is part of the creator-account flow, coming soon.`);
  return null;
};

// User-side: fully wired.

export const getStripeCustomer = async (
  _uid: string,
): Promise<Stripe.Customer | null> => {
  try {
    const { data } = await axios().get('/billing');
    return (data?.billing?.customer?.stripeValue as Stripe.Customer) ?? null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const createNewStripeCustomer = async () => {
  logEvent(EventMessages.Billing.NewCustomer);
  try {
    const { data } = await axios().post('/billing/customer', {});
    return data?.billing?.customer?.stripeValue as Stripe.Customer | null;
  } catch (e) {
    console.error(e);
    toast.error('Could not create billing account.');
    return null;
  }
};

/** Attach a payment source (Stripe source / payment method id) to the
 *  authenticated user's Stripe customer. The form posts the source id
 *  it minted via Stripe Elements; this fans the attachment out to
 *  Stripe and promotes it to default. */
export const addSourceToCustomer = async (sourceId: string) => {
  const { data } = await axios().post('/billing/methods', { sourceId });
  return data;
};

export const getStripeCards = async () => {
  try {
    const { data } = await axios().get('/billing/methods');
    return (data?.methods as Stripe.PaymentMethod[]) ?? [];
  } catch (e) {
    console.error("can't get cards", e);
    return [];
  }
};

export const deletePayment = (sourceId: string) => {
  return axios()
    .delete(`/billing/methods?id=${encodeURIComponent(sourceId)}`)
    .catch((error) => {
      console.error(error);
      throw new Error('Failed To Remove Payment');
    });
};

export const setDefaultPayment = (sourceId: string) => {
  return axios()
    .put('/billing/methods', { sourceId })
    .catch((error) => {
      console.error(error);
      throw new Error('Failed To Set Default Payment');
    });
};

export const getAllSubscriptions = async (): Promise<Array<SubscriptionUnion> | undefined> => {
  try {
    const { data } = await axios().get('/billing/subscriptions');
    return (data as Array<SubscriptionUnion>) ?? undefined;
  } catch (e) {
    console.error(e);
    return undefined;
  }
};

export const createSubscription = async (
  communityId: string,
  tierId: string,
  accountId: string,
) => {
  logEvent(EventMessages.Billing.Subscribe, { communityId, tierId });
  try {
    const { data } = await axios().post('/billing/subscription', {
      priceId: tierId,
      communityId,
      accountId,
    });
    return data;
  } catch (error) {
    console.error(error);
    throw new Error('FailedCreateNewSubscription');
  }
};

export const cancelSubscription = async (
  subscriptionId: string,
  communityId: string,
) => {
  logEvent(EventMessages.Billing.UnSubcribe, { communityId, subscriptionId });
  try {
    const { data } = await axios().delete(
      `/billing/subscription?stripeId=${encodeURIComponent(subscriptionId)}`,
    );
    return data;
  } catch (error) {
    console.error(error);
    throw new Error('FailedRemoveSubscription');
  }
};

// Creator-side: stubbed until /api/billing/account etc. land.

export const getStripeCreator = async (
  _uid: string,
): Promise<Stripe.Account | null> => null;

export const getLoginLink = async (): Promise<Stripe.LoginLink | null> =>
  creatorTodo('Stripe creator dashboard link');

export const getNewAccountLink = async (): Promise<Stripe.AccountLink | null> =>
  creatorTodo('Stripe onboarding link');

export const getAccountLink = async (
  _uid: string,
): Promise<Stripe.AccountLink | null> =>
  creatorTodo('Stripe onboarding link');

export const createStripeAccount = async (): Promise<Stripe.AccountLink | null> => {
  logEvent(EventMessages.Billing.NewCreator);
  return creatorTodo('Creator account creation');
};

export const forceUpdateStripeAccount = async (_uid: string) =>
  creatorTodo('Creator account resync');

export const deleteTier = async (_communityId: string, _tierId: string) =>
  creatorTodo('Subscription tier removal');

export const createNewPrice = async (
  _price: number,
  _communityId: string,
  _tierId: string,
): Promise<Stripe.Price | null> => creatorTodo('Tier pricing');

export const updatePrice = async (
  _price: number,
  _communityId: string,
  _tierId: string,
): Promise<Stripe.Price | null> => creatorTodo('Tier pricing');
