// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { createSelector } from '@reduxjs/toolkit';
import createParamSelector from '@src/hooks/createParamSelector';

import { RootState } from 'store/store';

const selectBillingCustomer = (state: RootState) => state.billing.customer;
const selectBillingAccount = (state: RootState) => state.billing.account;

export const selectHasCustomer = createSelector(
  selectBillingCustomer,
  // undefined so we can determine if loaded
  (customer) : boolean | undefined => customer === undefined ? undefined : customer?.id ? true : false,
);

export const selectHasAccount = createSelector(
  selectBillingAccount,
  // undefined so we can determine if loaded
  (account) : boolean | undefined => account === undefined ? undefined : account?.id ? true : false,
);