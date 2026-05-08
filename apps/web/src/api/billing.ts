// Stripe billing client. Replaced the Firebase Cloud Functions surface
// (httpsCallable for ~17 functions) with calls into our own
// pages/api/billing/* routes — those routes use lib/stripe (server-side
// Stripe SDK) and api2/* (Postgres) directly, so this file becomes a
// thin axios wrapper.
//
// Both halves are now wired:
//   user-side: customer / methods / subscription
//   creator-side: account onboarding + tier publication
import { toast } from 'react-toastify';
import Stripe from 'stripe';

import axios from '@src/lib/axios';
import logEvent, { EventMessages } from 'lib/events';
import { CommunityDocument } from 'types/documents';

import { CommunityUnion } from './communityAPI';

export type SubscriptionUnion = Stripe.Subscription & {
  community: CommunityDocument | CommunityUnion,
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

// Creator-side: account onboarding.

export type CreatorAccountState = {
  account: Stripe.Account | null;
  link: Stripe.AccountLink | Stripe.LoginLink | null;
  linkType: 'onboarding' | 'dashboard' | null;
};

export const getStripeCreator = async (
  _uid?: string,
): Promise<CreatorAccountState> => {
  try {
    const { data } = await axios().get('/billing/account');
    return data as CreatorAccountState;
  } catch (e) {
    console.error(e);
    return { account: null, link: null, linkType: null };
  }
};

export const createStripeAccount = async (
  body: { fName?: string; lName?: string; dob?: { month: number; day: number; year: number } } = {},
): Promise<{ account: Stripe.Account; accountLink: Stripe.AccountLink } | null> => {
  logEvent(EventMessages.Billing.NewCreator);
  try {
    const { data } = await axios().post('/billing/account', body);
    return data as { account: Stripe.Account; accountLink: Stripe.AccountLink };
  } catch (e) {
    console.error(e);
    toast.error('Could not create creator account.');
    return null;
  }
};

// Re-issue an onboarding link for the existing account. The GET
// route returns a fresh link each time (Stripe links expire fast —
// a few minutes) so we just refetch.
export const getNewAccountLink = async (): Promise<Stripe.AccountLink | null> => {
  const state = await getStripeCreator();
  if (state.linkType === 'onboarding') return state.link as Stripe.AccountLink;
  return null;
};

export const getAccountLink = getNewAccountLink;

// Stripe Express dashboard login link. Same GET route — when the
// account is fully onboarded the route returns a LoginLink instead.
export const getLoginLink = async (): Promise<Stripe.LoginLink | null> => {
  const state = await getStripeCreator();
  if (state.linkType === 'dashboard') return state.link as Stripe.LoginLink;
  return null;
};

// "Force update" used to be a Cloud Function that re-pulled the
// Stripe account state. Now GET /api/billing/account always returns
// the live state, so this just delegates and surfaces the account.
export const forceUpdateStripeAccount = async (_uid?: string): Promise<Stripe.Account | null> => {
  const state = await getStripeCreator();
  return state.account;
};

// Creator-side: tier publication.

export type TierPayload = {
  id: string;
  uuid: string;
  title: string;
  description: string;
  perks: string[];
  price: number;
  stripePriceId: string | null;
};

export const createTier = async (
  communityId: string,
  body: { title: string; description?: string; perks?: string[]; priceUsd: number },
): Promise<TierPayload | null> => {
  try {
    const { data } = await axios().post(`/community/${communityId}/tiers`, body);
    return data?.tier ?? null;
  } catch (e) {
    console.error(e);
    toast.error('Could not create tier.');
    return null;
  }
};

export const updateTier = async (
  communityId: string,
  tierId: string,
  body: { title?: string; description?: string; perks?: string[]; priceUsd?: number },
): Promise<TierPayload | null> => {
  try {
    const { data } = await axios().patch(`/community/${communityId}/tiers/${tierId}`, body);
    return data?.tier ?? null;
  } catch (e) {
    console.error(e);
    toast.error('Could not update tier.');
    return null;
  }
};

export const deleteTier = async (
  communityId: string,
  tierId: string,
): Promise<boolean> => {
  try {
    await axios().delete(`/community/${communityId}/tiers/${tierId}`);
    return true;
  } catch (e) {
    console.error(e);
    toast.error('Could not delete tier.');
    return false;
  }
};

// Legacy aliases for callers that haven't been updated yet. New
// callers should use `createTier`/`updateTier` directly with priceUsd.
export const createNewPrice = async (
  price: number,
  communityId: string,
  _tierId: string,
): Promise<TierPayload | null> => createTier(communityId, { title: 'Tier', priceUsd: price });

export const updatePrice = async (
  price: number,
  communityId: string,
  tierId: string,
): Promise<TierPayload | null> => updateTier(communityId, tierId, { priceUsd: price });
