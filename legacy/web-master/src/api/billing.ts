// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { toast } from 'react-toastify';
import { PaymentMethod } from '@stripe/stripe-js/types/api';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import Stripe from 'stripe';

import logEvent, { EventMessages } from 'lib/events';
import { Collections, CommunityDocument, PrivateUserDocument } from 'shared/types/documents';
import { StripeCountries } from 'types/stripeAccount';
import { db } from 'util/firebase';

import { communityTable, CommunityUnion } from './communityAPI';

export type SubscriptionUnion = Stripe.Subscription & {
  community: CommunityDocument | CommunityUnion,
};

export const getStripeCustomer = (uid: string) : Promise<Stripe.Customer | null> => {
  const docRef = doc(db, Collections.UsersPrivate, uid, Collections.Stripe, Collections.StripeCustomer);
  return getDoc(docRef).then((document) => {
    if (document.exists()) {
      return document.data() as Stripe.Customer;
    } else {
      return null;
    }
  }).catch((error) => {
    console.log(error);
    return null;
  });
};

export const getStripeCreator = (uid: string) : Promise<Stripe.Account | null> => {
  const docRef = doc(db, Collections.UsersPrivate, uid, Collections.Stripe, Collections.StripeAccount);
  return getDoc(docRef).then((document) => {
    if (document.exists()) {
      return document.data() as Stripe.Account;
    } else {
      return null;
    }
  }).catch((error) => {
    console.error(error);
    // toast.error('Something went wrong, please note the time and contact support.');
    return null;
  });
};

export const getLoginLink = () => {
  const functions = getFunctions();
  const newExpressLoginLink = httpsCallable(functions, 'newExpressLoginLink');
  return newExpressLoginLink()
    .then((result) => {
      // Read result of the Cloud Function.
      const data = result?.data;
      if (data) return data as Stripe.LoginLink;
      else return null;
    })
    .catch((error) => {
      console.error(error);
      // toast.error('Something went wrong, please note the time and contact support.');
      return null;
    });
};

export const getNewAccountLink = () => {
  const functions = getFunctions();
  const newAccountLink = httpsCallable(functions, 'newAccountLink');
  return newAccountLink()
    .then((result) => {
      // Read result of the Cloud Function.
      const data = result?.data;
      if (data) return data as Stripe.AccountLink;
      else return null;
    })
    .catch((error) => {
      console.error(error);
      // toast.error('Something went wrong, please note the time and contact support.');
      return null;
    });
};

export const getAccountLink = (uid: string) : Promise<Stripe.AccountLink | null> => {
  const docRef = doc(db, Collections.UsersPrivate, uid);
  return getDoc(docRef).then((document) => {
    if (document.exists()) {
      const docData = document.data() as PrivateUserDocument;
      const accountLink = docData.account_link;
      if (accountLink?.expires_at && accountLink.expires_at > Date.now()) {
        return accountLink;
      } else { // This one expired, get a new one
        return getNewAccountLink();
      }
    } else {
      return null;
    }
  }).catch((error) => {
    console.error(error);
    // toast.error('Something went wrong, please note the time and contact support.');
    return null;
  });
};

//TODO Check for existing first (prob call getStripeCustomer)
export const createNewStripeCustomer = () => {
  logEvent(EventMessages.Billing.NewCustomer);
  const functions = getFunctions();
  const NewStripeCustomer = httpsCallable(functions, 'NewStripeCustomer');
  NewStripeCustomer()
    .then((result : HttpsCallableResult) => {
      // Read result of the Cloud Function.
      const data = result?.data;
      if (data) return data as Stripe.Customer;
      else return null;
    })
    .catch((error : any) =>  {
      console.error(error);
      toast.error('Something went wrong, please note the time and contact support.');
      return null;
    });
};

// Creator account
export const createStripeAccount = (country: StripeCountries) => {
  logEvent(EventMessages.Billing.NewCreator);
  const functions = getFunctions();
  const NewStripeAccount = httpsCallable(functions, 'NewStripeAccount');
  return NewStripeAccount({ country })
    .then((result) => {
      // Read result of the Cloud Function.
      const data = result?.data;
      if (data) return data as Stripe.AccountLink;
      else return null;
    })
    .catch((error) => {
      console.error(error);
      toast.error('Something went wrong, please note the time and contact support.');
      return null;
    });
};

export const getStripeCards = () => {
  const functions = getFunctions();
  const getPaymentSources = httpsCallable(functions, 'getPaymentSources');
  return getPaymentSources()
    .then((result) => {
      // Read result of the Cloud Function.
      /** @type {any} */
      const data = result.data;
      return data as Array<PaymentMethod>;
    })
    .catch((error) => console.error('can\'t get cards', error));
};

export const deletePayment = (sourceId: string) => {
  const functions = getFunctions();
  const fbFunction = httpsCallable(functions, 'removePaymentMethod ');
  return fbFunction( sourceId )
    .catch((error) => {console.error(error); throw new Error('Failed To Remove Payment');});
};

export const deleteTier = (communityId: string, tierId: string) => {
  const functions = getFunctions();
  const fbFunction = httpsCallable(functions, 'removeTier');
  return fbFunction({ communityId, tierId })
    .catch((error) => {console.error(error); throw new Error('FailedRemoveTier');});
};

export const getAllSubscriptions = () : Promise<Array<SubscriptionUnion> | undefined> => {
  const functions = getFunctions();
  const getSubscriptionHistory = httpsCallable(functions, 'getSubscriptionHistory');
  return getSubscriptionHistory()
    .then((result : HttpsCallableResult) => {
      // Read result of the Cloud Function.
      const data = result.data as Stripe.ApiList<Stripe.Subscription>;
      const temp = data?.data as Array<SubscriptionUnion>;
      if (temp) {
        return Promise.all(temp.map(async (sub) => {
          const community = await communityTable.getWithId(sub.metadata.community || '');
          return {
            ...sub,
            community: community,
          } as SubscriptionUnion;
        }));
      } else {
        return undefined;
      }
    })
    .catch((error) => {console.log(error); return undefined;});
};

//If webhook doesn't do it's job, we want to manually go get it.
export const forceUpdateStripeAccount = (uid: string) => {
  const functions = getFunctions();
  const fetchStripeAccount = httpsCallable(functions, 'fetchStripeAccount');
  return fetchStripeAccount()
    .then((result) => {
      // Read result of the Cloud Function.
      const data = result?.data as Stripe.Account;
      if (data) {
        const docRef = doc(db, Collections.UsersPrivate, uid, Collections.Stripe, Collections.StripeAccount);
        setDoc(docRef, data, { merge: true });
        return data;
      } else return null;
    })
    .catch((error) => {
      console.error(error);
      // toast.error('Something went wrong, please note the time and contact support.');
      return null;
    });
};

export const createNewPrice = (price : number, communityId: string, tierId: string) => {
  logEvent(EventMessages.Billing.PriceUpdate, { community: communityId, tier: tierId });
  const functions = getFunctions();
  const fbFunction = httpsCallable(functions, 'createNewPrice');
  return fbFunction({ price, communityId, tierId })
    .then((result) => {
      // Read result of the Cloud Function.
      /** @type {any} */
      const data = result.data;
      return data as Stripe.Price;
    })
    .catch((error) => {console.error(error); throw new Error('FailedCreateNewPrice');});
};


export const updatePrice = (price : number, communityId: string, tierId: string) => {
  logEvent(EventMessages.Billing.PriceUpdate, { community: communityId, tier: tierId });
  const functions = getFunctions();
  const fbFunction = httpsCallable(functions, 'updatePrice');
  return fbFunction({ price, communityId, tierId })
    .then((result) => {
      // Read result of the Cloud Function.
      /** @type {any} */
      const data = result.data;
      return data as Stripe.Price;
    })
    .catch((error) => {console.error(error); throw new Error('FailedUpdatePrice');});
};

export const setDefaultPayment = (sourceId: string) => {
  const functions = getFunctions();
  const fbFunction = httpsCallable(functions, 'setDefaultPaymentSource');
  return fbFunction( sourceId )
    .catch((error) => {console.error(error); throw new Error('Failed To Set Default Payment');});
};

export const createSubscription = (communityId: string, tierId: string) => {
  logEvent(EventMessages.Billing.Subscribe, { communityId: communityId, tierId: tierId });
  const functions = getFunctions();
  const fbFunction = httpsCallable(functions, 'createNewSubscription');
  return fbFunction({ communityId, tierId })
    .catch((error) => {console.error(error); throw new Error('FailedCreateNewSubscription');});
};

export const cancelSubscription = (subscriptionId: string, communityId: string) => {
  logEvent(EventMessages.Billing.UnSubcribe, { communityId: communityId, subscriptionId: subscriptionId });
  const functions = getFunctions();
  const fbFunction = httpsCallable(functions, 'removeSubscription');
  return fbFunction({ subscriptionId, communityId })
    .catch((error) => {console.error(error); throw new Error('FailedRemoveSubscription');});
};
