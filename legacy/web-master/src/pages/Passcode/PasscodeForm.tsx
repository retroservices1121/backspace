// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';

import FormInput from 'components/FormInput';
import { isDevelopment } from 'shared/common_utils';
import { Button } from 'styles/form';
import { Space } from 'styles/layout';
import { FormType } from 'types/forms';
import { VERSION } from 'util/constants';
import { FormDebug } from 'util/FormDebug';

import { BiggerFont } from './styles';

export enum PasscodeFields {
  Code = 'code',
}

export type PasscodeState = {
  [PasscodeFields.Code]: string;
};

const PassCodeSchema = Yup.object().shape({
  [PasscodeFields.Code]: Yup.string()
    .uppercase()
    .trim()
    .required('is required'),
});

const INITAL_STATE: PasscodeState = {
  [PasscodeFields.Code]: '',
};

type Props = {};

const PasscodeForm: FormType<PasscodeState, Props> = ({
  onSubmit,
}) => (
  <Formik<PasscodeState>
    onSubmit={onSubmit}
    validationSchema={PassCodeSchema}
    initialValues={INITAL_STATE}
  >
    <Form>
      <FormDebug name={'PasscodeForm'} />
      <h1>Backspace Closed {VERSION} </h1>
      <Space direction='column' size='md' />
      <h4> Backspace currently has a waitlist. <br/> For now, a code is required to access the closed beta.</h4>
      <Space direction='column' size='lg' />
      <h3>Enter VIP code to skip the queue.</h3>
      {isDevelopment()  
        ? <p>psst... in development the code is "<strong>test</strong>"</p>
        : <p><br />psst... if you're coming here from <a href='https://www.producthunt.com/products/backspace'><strong>Product Hunt</strong></a>, use the code "<strong>Goldenkitty</strong>" to skip the queue.</p>
      }
      <BiggerFont>
        <Field
          placeholder="Access Code"
          name={PasscodeFields.Code}
          as={FormInput}
        />
      </BiggerFont>
      
      <Button type="submit">Submit</Button>
      
    </Form>
  </Formik>
);

export default PasscodeForm;
