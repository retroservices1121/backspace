// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import { Field, Form, Formik } from 'formik';
import { FormDebug } from 'utils/FormDebug';
import * as Yup from 'yup';

import { PasswordInput } from 'components/Auth/PasswordInput';
import { LargeTextButton } from 'styles/Buttons';
import { HorizontalLine } from 'styles/Dividers';
import { OldRow } from 'styles/Flex';
import { FieldError } from 'styles/form';
import { Space } from 'styles/layout';
import { FormType } from 'types/forms';
import { SecurityFields, SecurityFormState } from 'types/settings';

const SecuritySchema = Yup.object().shape({
  [SecurityFields.NewPassword]: Yup.string()
    .min(8, 'is too short. Minimum of 8 characters.')
    .max(50, 'is too long')
    .trim()
    .required('is required'),
  [SecurityFields.ConfirmPassword]: Yup.string()
    .oneOf([Yup.ref(SecurityFields.NewPassword), null], 'Passwords must match'),
});

type Props = {};

const SecurityForm: FormType<SecurityFormState, Props> = ({
  onSubmit,
}) => {

  
  let INITAL_STATE: SecurityFormState = {
    [SecurityFields.NewPassword] : '',
    [SecurityFields.ConfirmPassword] : '',
  };

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      initialValues={INITAL_STATE}
      validationSchema={SecuritySchema}
    >
      {({ errors, touched }) => (
        <Form>
          <FormDebug name="User Security Settings" />
          <h2>Security</h2>
          <HorizontalLine />
          <br />
          <h3>Change Password</h3>
          <h6>This will change your backspace login credentials.</h6>
          <br />
          <Field
            name={SecurityFields.NewPassword}
            placeholder="New Password"
            label="New Password*"
            component={PasswordInput}
          />
          {touched[SecurityFields.NewPassword] && errors[SecurityFields.NewPassword] && <FieldError>New password {errors[SecurityFields.NewPassword]}</FieldError>}
          <Field
            name={SecurityFields.ConfirmPassword}
            label="Confirm Password*"
            placeholder="Confirm Password"
            component={PasswordInput}
          />
          {touched[SecurityFields.ConfirmPassword] && errors[SecurityFields.ConfirmPassword] && <FieldError>{errors[SecurityFields.ConfirmPassword]}</FieldError>}
          
          <br /><br /><br />
          <OldRow>
            <Space />
            <LargeTextButton color='none' type="reset">Cancel</LargeTextButton>
            <Space/>
            <LargeTextButton color="primary" type="submit">Submit</LargeTextButton>
          </OldRow>
        </Form>
      )}
    </Formik>
  );
};

export default SecurityForm;
