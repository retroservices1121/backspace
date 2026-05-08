// Copyright 2021 NewSocial Inc.
// Author(s): Samuele Zanca

import React from 'react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';

import { APP } from 'pages';
import { openInNewTab } from 'shared/common_utils';
import { setPageTitle } from 'store/appSlice';
import { RootState } from 'store/store';
import { createUser } from 'store/userSlice';
import { Separator } from 'styles/Dividers';
import { RegisterFormState } from 'types/auth';
import { PRIVACY_URL, TOS_URL } from 'util/constants';

import AppleSSO from './components/AppleSSO';
import GoogleSSO from './components/GoogleSSO';
import RegisterForm from './components/RegisterForm';

const pageTitle = 'Create Account';

type Props = {};

const Register: React.FC<Props> = ({}) => {
  const history = useHistory();
  const dispatch = useDispatch();
  const { id : uid } = useSelector((state: RootState) => state.user);
  const location = useLocation<RegisterFormState>();

  dispatch(setPageTitle(pageTitle));

  const handleRegister = (formState : RegisterFormState) => {
    dispatch(createUser(formState));
  };

  useEffect(() => {
    if (uid) {
      history.push(APP.AUTH.ONBOARDING);
    }
  }, [ uid ]);

  return (
    <>
      <h1>{pageTitle}</h1>
      <h5>Let's connect with your communites around the world!</h5>

      <GoogleSSO />
      <AppleSSO />
      <Separator>
        Or Sign Up with Email
      </Separator>

      <RegisterForm
        onSubmit={handleRegister}
        stateFromLogin={location?.state}
        onNavigatePrivacy={() => openInNewTab(PRIVACY_URL)}
        onNavigateTerms={() => openInNewTab(TOS_URL)}

      />
    </>
  );
};

export default Register;
