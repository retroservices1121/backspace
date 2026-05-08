import React from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';

import { resetPassword } from 'api/auth';
import useRouting from 'hooks/useRouting';
import { APP } from 'pages';
import { setPageTitle } from 'store/appSlice';
import { ClickableSpan } from 'styles/Buttons';
import { Space } from 'styles/layout';
import { ForgotPasswordState } from 'types/auth';

import ForgotPassForm from './components/ForgotPassForm';
import { SwapFormSpan } from './components/styles';

const pageTitle = 'Forgot Password';

type Props = {};

const Login: React.FC<Props> = () => {
  const history = useRouting();
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

      <ClickableSpan onClick={() => history.navigate(APP.AUTH.LOGIN)}>
        I know my password
      </ClickableSpan>

      <Space direction="column" />

      <SwapFormSpan>
        {'Not a member yet? '}
        <ClickableSpan onClick={() => history.navigate(APP.AUTH.REGISTER)}>
          Create an Account
        </ClickableSpan>
      </SwapFormSpan>
    </>
  );
};

export default Login;