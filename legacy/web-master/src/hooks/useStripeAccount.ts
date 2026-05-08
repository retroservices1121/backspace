// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Stripe from 'stripe';

import { createStripeAccount, forceUpdateStripeAccount, getLoginLink, getNewAccountLink } from 'api/billing';
import { RootState } from 'store/store';
import { StripeCreateFields, StripeCreateState } from 'types/stripeAccount';

const useStripeAccount = () => {
  const uid = useSelector((state: RootState) => state.user.id);
  const [accountLink, setAccountLink] = useState<Stripe.AccountLink>();
  const [stripeAccount, setStripeAccount] = useState<Stripe.Account | null>();
  const [dashboardLink, setDashboardLink] = useState<Stripe.LoginLink>();
  const [setupComplete, setSetupComplete] = useState<boolean>();
  const [linkTimer, setLinkTimer] = useState<number>(0);
  
  const account = {
    new: async (form : StripeCreateState) => {
      const result = await createStripeAccount(form[StripeCreateFields.country].value);
      if (result) {
        setAccountLink(result);
        link.resetTimer();
        return account.get();
      } else {
        return null;
      }
    },
    get: async () => {
      const value = await forceUpdateStripeAccount(uid);
      if (value) {
        setStripeAccount(value);
      } else {
        setStripeAccount(null);
      }
      
    },
    setupComplete, 
    value: stripeAccount,
  };

  const link = {
    new: async () => {
      const result = await getNewAccountLink();
      if (result) {
        setAccountLink(result);
        link.resetTimer();
      }
      return result;
    },
    get: () => {
      return link.new();
    },
    resetTimer: () => {
      const startTime = 300;
      setLinkTimer(startTime);
    },
    timer: linkTimer, //seconds
    value: accountLink,
  };

  const dashboard = {
    get: async () => {
      const temp = await getLoginLink();
      if (temp) {
        setDashboardLink(temp);
      }
    },
    value: dashboardLink,
  };

  useEffect(() => {
    //Link Timer
    setInterval(() => {
      if (linkTimer >= 0){ //stop at -1
        setLinkTimer((current) => {
          if (link.timer >= 0) return current - 1;
          else return current;
        });
      }
    }, 1000);
  }, []);
  


  useEffect(() => {
    account.get();
  }, [uid]);

  useEffect(() => {
    if (link.timer === -1) {
      link.new();
    }
  }, [link.timer]);

  useEffect(() => {
    if (stripeAccount) {
      const dueActions = stripeAccount?.requirements?.currently_due;
      if (dueActions && dueActions.length > 0) {
        setSetupComplete(false);
        link.new();
      } else {
        setSetupComplete(true);
        dashboard.get();
      }
    }
  }, [account.value]);

  return {
    account,
    link, 
    dashboard,
  };
};

export default useStripeAccount;
