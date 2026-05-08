// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Stripe from 'stripe';

import { createNewStripeCustomer, createSubscription, getAllSubscriptions, SubscriptionUnion } from 'api/billing';
import { getCommunityById } from 'api/communityAPI';
import { FireDB } from 'api/firebase';
import { isProduction } from 'shared/common_utils';
import { Collections } from 'shared/types/documents';
import { RootState } from 'store/store';


enum StripeCollections {
  CUSTOMERS = 'stripe_customers',
  SUBSCRIPTIONS = 'subscriptions',
  CHECKOUTSESSION = 'checkout_session', //Different from extension on purpose
}

type CustomerDoc = {
  email: string,
  stripeId: string,
  stripeLink: string,
};

/**
 * This is designe to work with the firebase stripe extension
 * @returns hook to interact with stripe via firestore
 */
const useStripeCustomer = () => {
  const { id: authId } = useSelector((state: RootState)=> state.user);
  //TODO move setState to redux
  const [mySubscriptions, setMySubscriptions] = useState<SubscriptionUnion[]>([]);
  const [myCustomer, setMyCustomer] = useState<Stripe.Customer>();
  const [myCustomerId, setMyCustomerId] = useState<string>();

  const customer = {
    new: async () => {
      const currentCustomer = customer.get();
      if (!currentCustomer) await createNewStripeCustomer();
    },
    get: async () => {
      const stripeDocs = new FireDB<Stripe.Customer>(`${Collections.UsersPrivate}/${authId}/${Collections.Stripe}`);
      const fetchedCustomer = await stripeDocs.get('customer');
      if (fetchedCustomer) {
        setMyCustomer(fetchedCustomer);
        setMyCustomerId(fetchedCustomer.id);
      }
      return fetchedCustomer;
    },
    //Blocked by FB rules
    set: async (data: Stripe.Customer) => {
      const stripeDocs = new FireDB<Stripe.Customer>(`${Collections.UsersPrivate}/${authId}/${Collections.Stripe}`);
      await stripeDocs.setDoc(data, 'customer');
      return data;
    },
    //sync from user Private to user
    sync: async () => {
      const longDoc : Stripe.Customer | null = await customer.get();
      const shortDocs = new FireDB<CustomerDoc>('stripe_customers/');
      const shortDoc = await shortDocs.get(authId);
      if (!shortDoc && !longDoc) {
        console.warn('No stripe account');
        return false;
      } else if (longDoc) {
        const customerRecord : CustomerDoc = {
          email: longDoc.email || '',
          stripeId: longDoc.id || '',
          stripeLink: `https://dashboard.stripe.com${
            isProduction() ? '' : '/test'
          }/customers/${longDoc.id}`,
        };
        await shortDocs.setDoc(customerRecord, authId);
        return true;
      } else {
        return false;
      }
      
    },
    id: myCustomerId,
    value: myCustomer,
  };

  const subscriptions = {
    new: async (communityId: string, tier: string) => {
      await subscriptions.get();
      const existingSub = subscriptions.value.find((sub) => {
        if (sub.metadata.community === communityId && sub.status === 'active'){
          return true;
        } else {
          return false;
        }
      });
      if (existingSub) {
        toast.warn("You're already subscribed. Refresh page.");
        return existingSub;
      } else {
        return createSubscription(communityId, tier);
      }
    },
    set: async (subs: Stripe.Subscription[]) => {
      //Build Union
      const subUnion : SubscriptionUnion[] = [];
      for (const sub of subs) {
        const communityId = sub.metadata.community;
        if (communityId) {
          const community = await getCommunityById(communityId);
          //@ts-ignore
          subUnion.push({ ...sub, community });
        }
      }
      setMySubscriptions(subUnion);
    },
    sync: async () => {
      const subs = await getAllSubscriptions();
      if (!subs) return [];
      const fbDocs = new FireDB<any>(`${StripeCollections.CUSTOMERS}/${authId}/${StripeCollections.SUBSCRIPTIONS}/`);
      for (const sub of subs) {
        try {
          await fbDocs.setDoc(sub, sub.id);
        } catch (error) {
          console.warn(error);
        }
      }
      subscriptions.get();
      return subs;
    },
    get: async () => {
      const fbDocs = new FireDB<any>(`${StripeCollections.CUSTOMERS}/${authId}/${StripeCollections.SUBSCRIPTIONS}`);
      const subDocs = await fbDocs.getAllWithId();
      subscriptions.set(subDocs);
      return subDocs;
    },
    value: mySubscriptions,
  };

  useEffect(() => {
    if (authId) {
      customer.sync();
      subscriptions.get();
      subscriptions.sync();
    }
  }, [authId]);

  return {
    customer,
    subscriptions,
  };

};

export default useStripeCustomer;