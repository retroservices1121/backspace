import React from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { Field, Form, Formik } from 'formik';
import { useRouter } from 'next/router';
import { FormDebug } from 'utils/FormDebug';
import * as Yup from 'yup';

import FormInput, { ErrorMessage } from 'components/FormInput';
import { APP } from 'pages';
import { RootState } from 'store/store';
import { ClickableSpan } from 'styles/Buttons';
import { Button } from 'styles/form';
import { RegisterFields, RegisterFormState } from 'types/auth';
import { OnSubmit } from 'types/forms';

import { PasswordInput } from './PasswordInput';
import { Legal, SwapFormSpan } from './styles';


const RegisterSchema = Yup.object().shape({
  [RegisterFields.Email]: Yup.string()
    .email()
    .required('is required'),
  [RegisterFields.Password]: Yup.string()
    .min(8, 'is too short. Minimum of 8 characters.')
    .max(50, 'is too long')
    .required('is required'),
});

const INITIAL_STATE: RegisterFormState = {
  [RegisterFields.Email]: '',
  [RegisterFields.Password]: '',
};

type Props = {
  onSubmit: OnSubmit<RegisterFormState>;
  onNavigateTerms: () => void;
  onNavigatePrivacy: () => void;
  // Register has the two fields we care about so we'll use it on both pages
  stateFromLogin?: RegisterFormState;
};

const RegisterForm: React.FC<Props> = ({
  onSubmit, onNavigatePrivacy, onNavigateTerms, stateFromLogin = {},
}) => {
  const router = useRouter();
  //const dispatch = useDispatch();
  const handleSwapToLogin = (values: RegisterFormState) => {
    router.push(APP.AUTH.LOGIN);
    //FIXME: Push data with next router
    //dispatch(push(APP.AUTH.LOGIN, values));
  };
  const isLoading = useSelector((state: RootState) => state.load.authLoader);

  return (
    <Formik
      onSubmit={onSubmit}
      validationSchema={RegisterSchema}
      initialValues={{
        ...INITIAL_STATE,
        ...stateFromLogin,
      }}
    >
      {({ values }) => (
        <Form>
          <FormDebug name={'RegisterForm'} />
          <Field
            name={RegisterFields.Email}
            placeholder="Email"
            label="Email Address*"
            as={FormInput}
          />
          <ErrorMessage name={RegisterFields.Email}>
            {msg => `email ${msg}`}
          </ErrorMessage>

          <Field
            name={RegisterFields.Password}
            placeholder="Password"
            component={PasswordInput}
          />
          <ErrorMessage name={RegisterFields.Password}>
            {msg => `password ${msg}`}
          </ErrorMessage>

          <Legal>
            {'By creating an account you agree to the '}
            <ClickableSpan onClick={onNavigateTerms}>
              Terms and Conditions
            </ClickableSpan>
            {' and '}
            <ClickableSpan onClick={onNavigatePrivacy}>
              Privacy Policy
            </ClickableSpan>
            {'.'}
          </Legal>

          <Button type="submit">{isLoading ? 'Loading..' : 'Create Account'}</Button>

          <SwapFormSpan>
            {'Already have an account? '}
            <ClickableSpan onClick={() => handleSwapToLogin(values)}>
              Login
            </ClickableSpan>
          </SwapFormSpan>
        </Form>
      )}
    </Formik>
  );
};

export default RegisterForm;
