// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { PaymentMethod } from '@stripe/stripe-js';
import Stripe from 'stripe';

import {
  getStripeCards,
  getStripeCustomer,
} from 'api/billing';
import { RootState } from 'store/store';

import useStripeCustomer from './useStripeCustomer';


export default function useStripe() {
  const stripeCustomer = useStripeCustomer();
  const { id } = useSelector((state: RootState) => state.user);
  const [customer, setCustomer] = useState<Stripe.Customer | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  // const [subscriptions, setSubscriptions] = useState<Stripe.Subscription[]>([]);

  const updateSubscriptions = () => {
    return stripeCustomer.subscriptions.get();
  };

  const updateCustomer = async (userId: string) => {
    const result = await getStripeCustomer(userId);
    if (result) setCustomer(result);
  };

  const updateCards = async () => {
    const result = await getStripeCards();
    if (result) setPaymentMethods(result);
  };

  useEffect(() => {
    if (id) {
      updateCustomer(id);
      updateCards();
      updateSubscriptions();
    }
  }, [id]);

  return {
    customer,
    paymentMethods,
    subscriptions: stripeCustomer.subscriptions,
    refreshCustomer: () => {
      updateCustomer(id);
      updateCards();
    },
  };

}