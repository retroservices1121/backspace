// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';

import { FormDatePicker } from 'components/DatePicker/DatePicker';
import FormInput, { ErrorMessage } from 'components/FormInput';
import UploadPfp from 'components/UploadPfp';
import { ButtonLarge } from 'styles/Buttons';
import { FlexSpaceBetween, OldCol } from 'styles/Flex';
import { Space } from 'styles/layout';
import { OnboardingFields, OnboardingFormState } from 'types/auth';
import { FormType } from 'types/forms';
import { FormDebug } from 'utils/FormDebug';

const OnboardingSchema = Yup.object().shape({
  [OnboardingFields.Username]: Yup.string()
    .min(2, 'is too short')
    .max(50, 'is too long')
    .lowercase()
    .trim()
    .matches(/^[aA-zZ0-9\_]+$/, ': only letters & numbers are allowed')
    .required('is required'),
  [OnboardingFields.Firstname]: Yup.string()
    .min(2, 'is too short')
    .max(50, 'is too long')
    .trim()
    .required('is required'),
  [OnboardingFields.Lastname]: Yup.string()
    .min(2, 'is too short')
    .max(50, 'is too long')
    .trim()
    .required('is required'),
});


const INITIAL_STATE: OnboardingFormState = {
  [OnboardingFields.ProfilePic]: null,
  [OnboardingFields.Username]: '',
  [OnboardingFields.Firstname]: '',
  [OnboardingFields.Lastname]: '',
  [OnboardingFields.DateOfBirth]: null,
};

type OnboardingFormProps = Parameters<FormType<OnboardingFormState>>[0] & {
  initialUsername?: string | null;
};

const OnboardingForm = ({
  onSubmit,
  initialUsername,
}: OnboardingFormProps) => (
  <Formik
    onSubmit={onSubmit}
    initialValues={{
      ...INITIAL_STATE,
      ...(initialUsername
        ? { [OnboardingFields.Username]: initialUsername }
        : {}),
    }}
    enableReinitialize
    validationSchema={OnboardingSchema}
  >
    <Form>
      <FormDebug name="Auth OnboardingForm" />

      <Field
        name={OnboardingFields.ProfilePic}
        component={UploadPfp}
      />

      <Field
        name={OnboardingFields.Username}
        label="Username*"
        placeholder='ElonMuskFan420'
        as={FormInput}
      />
      <ErrorMessage name={OnboardingFields.Username}>
        {msg => `username ${msg}`}
      </ErrorMessage>

      <FlexSpaceBetween>
        <OldCol>
          <Field
            name={OnboardingFields.Firstname}
            label="First Name*"
            placeholder="Nikola"
            as={FormInput}
          />
          <ErrorMessage name={OnboardingFields.Firstname}>
            {msg => `first name ${msg}`}
          </ErrorMessage>
        </OldCol>

        <Space/>

        <OldCol>
          <Field
            name={OnboardingFields.Lastname}
            label="Last Name*"
            placeholder="Tesla"
            as={FormInput}
          />
          <ErrorMessage name={OnboardingFields.Lastname}>
            {msg => `last name ${msg}`}
          </ErrorMessage>
        </OldCol>
      </FlexSpaceBetween>

      <Field
        name={OnboardingFields.DateOfBirth}
        component={FormDatePicker}
        label="Date of Birth"
      />

      <Space direction="column" />

      <ButtonLarge type="submit">Continue</ButtonLarge>
    </Form>
  </Formik>
);

export default OnboardingForm;
