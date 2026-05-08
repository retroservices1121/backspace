// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Stripe } from 'stripe';
import { SimpleDate } from '../../src/shared/types/documents';
import * as functions from 'firebase-functions';
import { StripeCountries } from '../../src/types/stripeAccount';
// TODO move stripe key
export const stripe = require('stripe')(functions.config().stripe.secret);

//Fee to charge creator
const fee = 10;

/** Defined by Stripe API */
enum StripeAccountType {
  Custom = 'custom',
  Express = 'express',
  Standard = 'standard',
}

/** Defined by Stripe API */
// enum StripeCountries {
//   US = 'US',
// }

export type StripeIndividual = {
  first_name? : string,
  last_name? : string,
  email?: string,
  dob? : {
    /** 1 to 12 */
    month: number,
    /** 1 to 31 */
    day: number, 
    /** 4-digit year */
    year: number
  },
  
};

/** Defined by Stripe API */
export type StripeAccount = {
  type: StripeAccountType,
  country: StripeCountries,
  email: string,
  business_type: string,
  business_profile?: object,
  individual?: StripeIndividual,
  capabilities?: Object,
  metadata?: object
};

/** Create a new Stripe Express account (for businesses) */
export const CreateNewStripeAccount = async (uid : string, email: string, username: string, fName : string | undefined, lName: string | undefined, dob: SimpleDate, country: StripeCountries = StripeCountries.United_States) => {

  const newIndividual : StripeIndividual = {
    email: email,
  };
  if (fName) newIndividual.first_name = fName;
  if (lName) newIndividual.last_name = lName;
  if (dob) newIndividual.dob = dob;


  // eslint-disable-next-line
  const newAccount : StripeAccount = {
    type: StripeAccountType.Express,
    country: country,
    email: email,
    business_type: 'individual',
    business_profile: { url: `https://backchannel.to/${username}` },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    individual: newIndividual,
    metadata: {
      uid: uid,
    },
  };

  const account = await stripe.accounts.create(newAccount);
  return account;
};

/** Generate an account link for a given stripe account */
export const CreateAccountLink = async (stripeAccount : string) : Promise<Stripe.AccountLink> => {
  let request : Stripe.AccountLinkCreateParams = {
    account: stripeAccount,
    refresh_url: 'https://backchannel.to/app/settings',
    return_url: 'https://backchannel.to/app/settings',
    type: 'account_onboarding',
  };
  const accountLink : Stripe.AccountLink = await stripe.accountLinks.create(request);
  return accountLink;
};

/** Create a new customer */
export const CreateNewStripeCustomer = async (uid: string, email: string, name?: string, phone?: string) => {
  let customerRequest : Stripe.CustomerCreateParams = {
    email: email,
    metadata: {
      uid: uid,
    },
  };
  if (name) customerRequest.name = name;
  if (phone) customerRequest.phone = phone;

  const customer: Stripe.Customer = await stripe.customers.create(customerRequest);
  return customer;
};

/** Update an already existing customer */
export const UpdateStripeCustomer = async (customerId: string, update : Stripe.CustomerUpdateParams) => {
  const customer = await stripe.customers.update(
    customerId,
    update,
  );
  return customer;
};

/** Create a new Stripe Payment Method */
export const createPaymentMethod = async (method : Stripe.PaymentMethodCreateParams) => {
  const paymentMethod = await stripe.paymentMethods.create(method);
  return paymentMethod;
};

/** Attached a created payment method to specific customer */
export const AttachPaymentMethod = async (customerId : string, methodId : string) => {
 
  // Set default payment method
  await stripe.customers.update(
    customerId,
    { source: methodId },
  );
  // Attach source
  await stripe.paymentMethods.attach(
    methodId,
    { customer: customerId },
  );
};

/** Get an array of payment methods*/
export const GetPaymentMethods = (customerId : string, type : Stripe.PaymentMethodListParams.Type) => {
  return stripe.customers.listPaymentMethods(
    customerId, 
    { type: type },
  );
};

export const setDefaultSource = async (customerId : string, sourceId : string) => {
  const customerUpdate : Stripe.CustomerUpdateParams = {
    default_source: sourceId,
  };
  const customer = await stripe.customers.update(
    customerId,
    customerUpdate,
  );
  return customer;
};

export const detachPaymentMethod = async (sourceId : string) => {
  const paymentMethod = await stripe.paymentMethods.detach(
    sourceId,
  );
  return paymentMethod;
};

/** Get past transactions */
export const getAllSubscriptions = (customerId : string) => {
  const request : Stripe.SubscriptionListParams = {
    customer: customerId,
    limit: 100,
  };
  return stripe.subscriptions.list(request);
};

export const getStripeAccount = async (customerId: string) => {
  const account = await stripe.accounts.retrieve(customerId);
  return account;
};

export const getLoginLink = async (customerId: string) => {
  const link : Stripe.LoginLink = await stripe.accounts.createLoginLink(customerId);
  return link;
};

/** Use for a brand new tier. Creates the product and the price */
export const createPriceAndProduct = async (productName: string, priceCents: number, productId: string, uid: string) : Promise<Stripe.Price> => {
  const request : Stripe.PriceCreateParams = {
    unit_amount: priceCents,
    currency: 'usd',
    recurring: { interval: 'month' },
    tax_behavior: 'inclusive',
    product_data: {
      id: productId,
      name: productName,
      metadata: {
        created_by: uid,
      },
    },
    metadata: {
      created_by: uid,
    },
    
  };
  const price : Stripe.Price = await stripe.prices.create(request);
  return price;
};

/** Creates a new price and attaches it to an existing object (tierId) */
export const createStripePrice = async (priceCents: number, tierId: string, uid: string) : Promise<Stripe.Price> => {
  const request : Stripe.PriceCreateParams = {
    unit_amount: priceCents,
    currency: 'usd',
    recurring: { interval: 'month' },
    product: tierId,
    metadata: {
      created_by: uid,
    },
    tax_behavior: 'inclusive',
  };
  const price : Stripe.Price = await stripe.prices.create(request);
  return price;
};

/** Disables a stripe price object for future purchases */
export const disableStripePrice = async (priceId: string) : Promise<Stripe.Price> => {
  const request : Stripe.PriceUpdateParams = {
    active: false,
  };
  const price : Stripe.Price = await stripe.prices.update(priceId, request);
  return price;
};

/** Product ID === Tier ID */
export const removeStripeProduct = async (productId: string) => {
  const product : Stripe.Product = await stripe.products.del(productId);
  return product;
};

export const createStripeSubscription = async (customerId: string, price: Stripe.Price, accountId: string, communityId: string, uid: string) => {
  let applicationFee = fee;
  //Add 30 cent processing fee as a percent
  applicationFee += (30 / Number(price.unit_amount)) * 100;
  //If application fee is outragous, set to 50% and move on
  if (applicationFee >= 100) applicationFee = 50;
  applicationFee = Math.round(applicationFee);
  const request : Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{ price: price.id }],
    application_fee_percent: applicationFee,
    transfer_data: {
      destination: accountId,
    },
    metadata: {
      community: communityId,
      uid: uid,
    },
  };
  const subscription = await stripe.subscriptions.create(request);
  return subscription;
};


export const removeStripeSubscription = async (subscriptionId: string) => {
  const deleted = await stripe.subscriptions.del(
    subscriptionId,
  );
  return deleted;
};
