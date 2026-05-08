// Copyright 2021 NewSocial Inc.
// Author(s): Samuele Zanca

import React from 'react';
import { useEffect } from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import { useSelector } from 'react-redux';
import AuthLayout from 'layouts/authLayout';
import { useRouter } from 'next/router';

import GoogleSSO from 'components/Auth/GoogleSSO';
import RegisterForm from 'components/Auth/RegisterForm';
import { APP } from 'pages';
import { setPageTitle } from 'store/appSlice';
import { RootState, useAppDispatch } from 'store/store';
import { createUser } from 'store/userSlice';
import { Separator } from 'styles/Dividers';
import { RegisterFormState } from 'types/auth';
import { openInNewTab } from 'utils/common_utils';
import { PRIVACY_URL, TOS_URL } from 'utils/constants';

const pageTitle = 'Create Account';

const Register: ReactLayoutComponentType = ({}) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id : uid } = useSelector((state: RootState) => state.user);
  //FIXME: figure out how to share form data between resister & login
  //const location = useLocation<RegisterFormState>();

  dispatch(setPageTitle(pageTitle));

  const handleRegister = async (formState : RegisterFormState) => {
    await dispatch(createUser(formState)).then(() => router.push(APP.AUTH.ONBOARDING));
  };

  useEffect(() => {
    if (uid) {
      router.push(APP.AUTH.ONBOARDING);
    }
  }, [ uid ]);

  return (
    <>
      <h1>{pageTitle}</h1>
      <h5>Let's connect with your communites around the world!</h5>

      <GoogleSSO />

      <Separator>
        Or Sign Up with Email
      </Separator>

      <RegisterForm
        onSubmit={handleRegister}
        //FIXME: figure out how to share form data between resister & login
        //stateFromLogin={location?.state}
        onNavigatePrivacy={() => openInNewTab(PRIVACY_URL)}
        onNavigateTerms={() => openInNewTab(TOS_URL)}

      />
    </>
  );
};

//FIXME: Dylan I need yo help!!
Register.Layout = AuthLayout;

export default Register;
