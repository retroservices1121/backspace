import React from 'react';
import { Field, Form, Formik } from 'formik';

import FormInput from 'components/FormInput';
import { Button } from 'styles/form';
import { ForgotPasswordState, LoginFields } from 'types/auth';
import { FormType } from 'types/forms';
import { FormDebug } from 'util/FormDebug';

const INITAL_STATE: ForgotPasswordState = {
  [LoginFields.Email]: '',
};

type Props = {};

const ForgotPassForm: FormType<ForgotPasswordState, Props> = ({
  onSubmit,
}) => (
  <Formik<ForgotPasswordState>
    onSubmit={onSubmit}
    // TODO validation (valid email)
    // validationSchema={}
    initialValues={INITAL_STATE}
  >
    <Form>
      <FormDebug name={'ForgotPassForm'} />
      <Field
        placeholder="Email"
        label="Email Address*"
        name={LoginFields.Email}
        as={FormInput}
      />

      <Button type="submit">Reset Password</Button>
    </Form>
  </Formik>
);

export default ForgotPassForm;