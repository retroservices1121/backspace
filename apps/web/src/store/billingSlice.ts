// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { BillingWithAll } from '@src/api2/billing';
import { SubscriptionWithCommunity } from '@src/types/billing';
import chalk from 'chalk';
import Stripe from 'stripe';

import axios from 'lib/axios';

import { RootState } from './store';

const NAMESPACE = 'billing';

type BillingState = BillingWithAll & {
  subscriptions: SubscriptionWithCommunity[]
  methods: Stripe.PaymentMethod[]
};

const initialState: BillingState = <BillingState>{};

function populateStateFromObject(object: any, state: BillingState) {
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      state[key] = object[key];
    }
  }
  return state;
}


export const updateBilling = createAsyncThunk(
  `${NAMESPACE}/updateBilling`,
  async (_, thunkAPI) => {
    const { auth } = thunkAPI.getState() as RootState;
    const { data } = await axios().get('billing');
    if (data.billing) {
      return data.billing;
    } else {
      return {};
    }
  },
);


export const getSubscriptions = createAsyncThunk(
  `${NAMESPACE}/getSubscriptions`,
  async (_, thunkAPI) => {
    //FIXME
    const {  } = thunkAPI.getState() as RootState;
    const { data } = await axios().get('billing/subscriptions');
    if (data) {
      console.log(data);
      return data;
    } else {
      return {};
    }
  },
);

export const getMethods = createAsyncThunk(
  `${NAMESPACE}/getMethods`,
  async (_, thunkAPI) => {
    //FIXME
    const { auth } = thunkAPI.getState() as RootState;
    const { data } = await axios().get('billing/methods');
    if (data.methods) {
      return data.methods;
    } else {
      return [];
    }
  },
);

const billingSlice = createSlice({
  name: NAMESPACE,
  initialState,
  reducers: {
    // setCustomer: (state, { payload }) => {state.customer = payload;},
    // setAccount: (state, { payload }) => {state.account = payload;},
    clearBillingSlice: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(updateBilling.fulfilled, (state, { payload }) => {
      state = populateStateFromObject(payload, state);
    });
    builder.addCase(getSubscriptions.fulfilled, (state, { payload }) => {
      state.subscriptions = payload;
    });
    builder.addCase(getMethods.fulfilled, (state, { payload }) => {
      state.methods = payload;
    });
  },
});

export default billingSlice.reducer;
export const {
  clearBillingSlice,
} = billingSlice.actions;