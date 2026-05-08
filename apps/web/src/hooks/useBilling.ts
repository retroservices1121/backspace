// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { PurchaseForm } from '@src/components/modals/PurchaseSubscription/components/PurchaseSubscriptionForm';
import { AuthStatus } from '@src/store/authSlice';
import { selectHasAccount, selectHasCustomer } from '@src/store/billing/selectors';
import { getMethods, getSubscriptions, updateBilling } from '@src/store/billingSlice';
import { throttle } from 'lodash';

import { toggleSubscribeModal } from 'store/appSlice';
import { RootState, useAppDispatch, useAppSelector } from 'store/store';

import useAuthentication from './useAuthenticate';
import { useAxios } from './useAxios';


export default function useBilling() {
  const dispatch = useAppDispatch();
  const axios = useAxios();
  const { id: userId } = useAppSelector((state: RootState) => state.user);
  const { 
    id: billingId,
    accountLink, 
    customer, 
    account,  
    subscriptions, 
    methods,
  }  = useAppSelector((state: RootState) => state.billing);
  const isCustomer = useSelector(selectHasAccount);
  const isCreator = useSelector(selectHasCustomer);
  const authState = useAuthentication();

  /** Create Stripe Customer from stored data */
  const createCustomer = async () => {
    
  };

  /** Create Stripe Express Account (Express) */
  const createAccount = async () => {
    
  };

  const purchaseSubscription = async (formState: PurchaseForm) => {

  };

  const cancelSubscription = async (stripeId: string) => {
    const { status } = await axios.delete(`billing/subscription?stripeId=${stripeId}`);
    if (status === 200) {
      fetchSubscriptions();
      return true;
    } else {
      return false;
    }
  };

  // FIXME cache these and merge them into a single request
  const fetchBilling = throttle(() => dispatch(updateBilling()), 1000 * 20);
  const fetchMethods = throttle(() => dispatch(getMethods()), 1000 * 20);
  const fetchSubscriptions = () => {
    //Sync Subscriptions from Stripe to PostgreSQL
    if (userId) axios.get(`billing/sync?id=${(userId).toString()}`);
    dispatch(getSubscriptions());
  };

  // This is a function we can call to sync all billing info with Stripe's info
  const fetchAllBillingInfo = async () => {
    try {
      await fetchBilling();
      fetchMethods();  
      fetchSubscriptions();
    } catch (e) {
      //silent fail
    }
  };

  useEffect(() => {
    //We want to wait until user is signed in, but not constantly refetch automatically
    if (authState === AuthStatus.SignedIn && !billingId) {
      fetchAllBillingInfo();
    }
  }, [authState]);


  return {
    /** Has a customer account */
    isCustomer,
    /** Has a creator account */
    isCreator,
    accountLink,
    account,
    customer,
    subscriptions, 
    methods,

    createAccount,
    createCustomer,

    fetchAllBillingInfo,
    fetchBilling,
    fetchMethods,
    fetchSubscriptions,
    toggleSubscribeModal: () => dispatch(toggleSubscribeModal()),
    purchaseSubscription,
    cancelSubscription,
  };
}
