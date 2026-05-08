// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect } from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import { toast } from 'react-toastify';
import useConstructor from '@src/hooks/useConstructor';
import { useOnboarding } from '@src/hooks/useOnboarding';
import { fetchUser } from '@src/store/userSlice';
import AuthLayout from 'layouts/authLayout';
import { useRouter } from 'next/router';

import OnboardingForm from 'components/Auth/OnboardingForm';
import { logEventScreen, Screens } from 'lib/events';
import { APP } from 'pages';
import { setPageTitle } from 'store/appSlice';
import { RootState, useAppDispatch, useAppSelector } from 'store/store';
import {  OnboardingFormState } from 'types/auth';

const pageTitle = 'You’re almost ready!';

const Onboarding: ReactLayoutComponentType = ({}) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const onboard = useOnboarding();
  const auth = useAppSelector((state: RootState) => state.auth);
  

  useConstructor(() => {
    dispatch(setPageTitle(pageTitle));
    logEventScreen(Screens.Onboarding);
  });
  

  const handleSubmitOnboarding = async (data: OnboardingFormState) => {
    const toastId = toast.loading('Checking Username');
    const usernameCheck = await onboard.checkUsername(data.username);
    if (!usernameCheck) {
      toast.update(toastId, {
        render: 'Username is taken :(',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
      return;
    }
    toast.update(toastId, {
      render: 'Creating Account',
    });
    const success = await onboard.submit(data);
    if (success) {
      dispatch(fetchUser(auth?.authId));
      toast.update(toastId, {
        render: 'Account Created',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      router.push(APP.INDEX);
    } else {
      toast.update(toastId, {
        render: 'An error occurred, please refresh the page and try again',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  //FIXME: To Support Google Signin
  useEffect(() => {
    if (onboard.isOnboarded === false) {
      router.push(APP.INDEX);
    }
  }, [onboard.isOnboarded]);

  return (
    <>
      <h1>{pageTitle}</h1>
      <h5>Let's connect with your communites around the world!</h5>

      <OnboardingForm
        onSubmit={handleSubmitOnboarding}
      />
    </>
  );
};

Onboarding.Layout = AuthLayout;

export default Onboarding;
