// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import useRouting from 'hooks/useRouting';
import { logEventScreen, Screens } from 'lib/events';
import { APP } from 'pages';
import { setPageTitle } from 'store/appSlice';
import { RootState } from 'store/store';
import { submitOnboarding } from 'store/userSlice';
import { OnboardingFormState } from 'types/auth';

import OnboardingForm from './components/OnboardingForm';

const pageTitle = 'You’re almost ready!';

type Props = {};

const Onboarding: React.FC<Props> = ({}) => {
  const dispatch = useDispatch();
  const history = useRouting();
  const { onboarded } = useSelector((state: RootState) => state.user);
  logEventScreen(Screens.Onboarding);

  dispatch(setPageTitle(pageTitle));

  const handleSubmitOnboarding = async (data: OnboardingFormState) => {
    dispatch(submitOnboarding(data));
  };

  //FIXME: To Support Google Signin
  useEffect(() => {
    if (onboarded) {
      history.navigate(APP.INDEX);
    }
  }, [onboarded]);

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

export default Onboarding;
