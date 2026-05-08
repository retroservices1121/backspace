import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { Field, Form, Formik } from 'formik';
import { useRouter } from 'next/router';
import { FormDebug } from 'utils/FormDebug';

import FormInput from 'components/FormInput';
import { Checkbox } from 'components/FormInput/styles';
import { APP } from 'pages';
//import { APP } from 'pages';
import { RootState } from 'store/store';
import { ClickableSpan } from 'styles/Buttons';
import { Flex, FlexSpaceBetween } from 'styles/Flex';
import { Button } from 'styles/form';
import { LoginFields, LoginFormState, RegisterFormState } from 'types/auth';
import { FormType } from 'types/forms';

import { PasswordInput } from './PasswordInput';
import { OptionsLabel, SwapFormSpan } from './styles';

const INITIAL_STATE: LoginFormState = {
  [LoginFields.Email]: '',
  [LoginFields.Password]: '',
  [LoginFields.RememberMe]: true,
};

type Props = {
  onForgotPassword: () => void;
  // Register has the two fields we care about so we'll use it on both pages
  stateFromRegister?: RegisterFormState;
};

const LoginForm: FormType<LoginFormState, Props> = ({
  onForgotPassword, onSubmit, stateFromRegister = {},
}) => {
  //const dispatch = useDispatch();
  const router = useRouter();
  const handleSwapToRegister = (values: RegisterFormState) => {
    router.push(APP.AUTH.REGISTER);
    //FIXME: Push data with next router
    //dispatch(router.push(APP.AUTH.REGISTER, values));
  };
  const isLoading = useSelector((state: RootState) => state.load.authLoader);

  return (
    <Formik<LoginFormState>
      onSubmit={onSubmit}
      // TODO validation (password criteria and valid email)
      // validationSchema={}
      initialValues={{
        ...INITIAL_STATE,
        ...stateFromRegister,
      }}
    >
      {({ values }) => (
        <Form>
          <FormDebug name={'LoginForm'} />
          <Field
            name={LoginFields.Email}
            label="Email Address*"
            placeholder="Email"
            as={FormInput}
          />


          <Field
            placeholder="Password"
            name={LoginFields.Password}
            component={PasswordInput}
          />

          <FlexSpaceBetween>
            <Flex>
              <Field
                id={LoginFields.RememberMe}
                name={LoginFields.RememberMe}
                type="checkbox"
                as={Checkbox}
              />
              <OptionsLabel htmlFor={LoginFields.RememberMe}>Remember Me</OptionsLabel>
            </Flex>

            <ClickableSpan onClick={onForgotPassword}>Forgot Password?</ClickableSpan>
          </FlexSpaceBetween>

          <Button type="submit">{isLoading ? 'Loading..' : 'Login'}</Button>

          <SwapFormSpan>
            {'Not a member yet? '}
            <ClickableSpan onClick={() => handleSwapToRegister(values)}>
              Create an Account
            </ClickableSpan>
          </SwapFormSpan>
        </Form>
      )}
    </Formik>
  );
};

export default LoginForm;
