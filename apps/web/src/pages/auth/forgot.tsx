import React from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import AuthLayout from 'layouts/authLayout';
import { useRouter } from 'next/router';

import { resetPassword } from 'api/auth';
import ForgotPassForm from 'components/Auth/ForgotPassForm';
import { SwapFormSpan } from 'components/Auth/styles';
import { APP } from 'pages';
import { setPageTitle } from 'store/appSlice';
import { ClickableSpan } from 'styles/Buttons';
import { Space } from 'styles/layout';
import { ForgotPasswordState } from 'types/auth';

const pageTitle = 'Forgot Password';

const Forgot: ReactLayoutComponentType = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  dispatch(setPageTitle(pageTitle));

  const handleResetPassword = (formState: ForgotPasswordState) => {
    resetPassword(formState)
      .then(() => toast.info('Password reset email has been sent.'))
      .catch(() => toast.error('User with that email doesn\'t exist.'));
  };

  return (
    <>
      <h1>{pageTitle}</h1>
      <h5>Let's connect with your communites around the world!</h5>

      <Space direction="column" />

      <ForgotPassForm
        onSubmit={handleResetPassword}
      />

      <ClickableSpan onClick={() => router.push(APP.AUTH.LOGIN)}>
        I know my password
      </ClickableSpan>

      <Space direction="column" />

      <SwapFormSpan>
        {'Not a member yet? '}
        <ClickableSpan onClick={() => router.push(APP.AUTH.REGISTER)}>
          Create an Account
        </ClickableSpan>
      </SwapFormSpan>
    </>
  );
};

//FIXME: Dylan I need yo help!!
Forgot.Layout = AuthLayout;

export default Forgot;
