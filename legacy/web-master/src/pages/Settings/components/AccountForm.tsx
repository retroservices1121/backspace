// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as Yup from 'yup';

import { getUserPrivateById } from 'api/userAPI';
import { FormDatePicker } from 'components/DatePicker/DatePicker';
import FormInput from 'components/FormInput';
import UsernameInput from 'components/UsernameInput';
import UploadBanner from 'pages/Settings/components/UploadBanner';
import { PrivateUserDocument } from 'shared/types/documents';
import { RootState } from 'store/store';
import { LargeTextButton } from 'styles/Buttons';
import { Space } from 'styles/layout';
import { FormType } from 'types/forms';
import { AccountFields, AccountFormState } from 'types/settings';
import { FormDebug } from 'util/FormDebug';

import { ImageHeader } from '../styled';
import UploadPfp from './UploadPfp';

const AccountSchema = Yup.object().shape({
  [AccountFields.Username]: Yup.string()
    .min(2, 'is too short')
    .max(50, 'is too long')
    .lowercase()
    .trim()
    .matches(/^[aA-zZ0-9\_]+$/, ': only letters & numbers are allowed'),
  [AccountFields.Firstname]: Yup.string()
    .min(2, 'is too short')
    .max(50, 'is too long')
    .trim(),
  [AccountFields.Lastname]: Yup.string()
    .min(2, 'is too short')
    .max(50, 'is too long')
    .trim(),
  [AccountFields.Email]: Yup.string()
    .email(),
});

type Props = {};

const AccountForm: FormType<AccountFormState, Props> = ({
  onSubmit,
}) => {

  const user = useSelector((state : RootState) => state.user);
  const [privateUser, setPrivateUser] = useState<PrivateUserDocument>();

  useEffect(() => {
    if (user.id) {
      getUserPrivateById(user.id).then((result) => {
        if (result) setPrivateUser(result);
      });
    }
  }, [user.id]);

  let INITIAL_STATE: AccountFormState = {
    [AccountFields.ProfilePic]: null,
    [AccountFields.BannerPic]: null,
    [AccountFields.Username]: user.username,
    [AccountFields.DisplayName]: user?.display_name || '',
    [AccountFields.Firstname]: privateUser?.first_name || '',
    [AccountFields.Lastname]: privateUser?.last_name || '',
    [AccountFields.Description]: user.description || '',
    [AccountFields.Email]: privateUser?.email || '',
    [AccountFields.PhoneNumber]: privateUser?.phone_number || '',
    [AccountFields.DateOfBirth]: privateUser?.dob,
  };

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      initialValues={INITIAL_STATE}
      validationSchema={AccountSchema}
    >
      {({  }) => (
        <Form>
          <FormDebug name="User Account Settings" />

          <ImageHeader>
            <Field
              name={AccountFields.BannerPic}
              component={UploadBanner}
              preview={user.banner_image}
            />

            <Field
              name={AccountFields.ProfilePic}
              component={UploadPfp}
              preview={user.avatar}
            />
          </ImageHeader>

          <h3>Profile</h3>
          <h5>Your public account information. This is how people will see, interact, and know you.</h5>
          <div className="my-12 flex flex-wrap sm:flex-nowrap">
              <Field
                name={AccountFields.DisplayName}
                label="Display Name"
                placeholder='Elon'
                as={FormInput}
              />
              <ErrorMessage name={AccountFields.DisplayName}>
                {msg => `username  ${msg}`}
              </ErrorMessage>

              <Field
                name={AccountFields.Username}
                label="Username"
                placeholder='ElonMuskFan420'
                as={UsernameInput}
              />
              <ErrorMessage name={AccountFields.Username}>
                {msg => `username  ${msg}`}
              </ErrorMessage>
          </div>

          <Field
            name={AccountFields.Description}
            label="About You"
            placeholder='Tell us about yourself'
            as={FormInput}
          />
          <h3 className="mt-12">Personal Information</h3>
          <h5>This information will NOT be publicly accessible.</h5>
          <br />

          <div className="grid sm:grid-cols-2 sm:gap-12 ">
            <Field
              name={AccountFields.Firstname}
              label="First Name"
              placeholder="Nikola"
              as={FormInput}
            />
            <ErrorMessage name={AccountFields.Firstname}>
              {msg => `first name  ${msg}`}
            </ErrorMessage>


            <Field
              name={AccountFields.Lastname}
              label="Last Name"
              placeholder="Tesla"
              as={FormInput}
            />
            <ErrorMessage name={AccountFields.Lastname}>
              {msg => `last name  ${msg}`}
            </ErrorMessage>
          </div>

          <div className="grid sm:grid-cols-2 sm:gap-12 ">
              <Field
                readonly
                name={AccountFields.Email}
                label="Email"
                placeholder="you@email.com"
                as={FormInput}
              />
              <ErrorMessage name={AccountFields.Email}/>

            <Field
              name={AccountFields.PhoneNumber}
              label="Phone Number"
              placeholder="555-555-0123"
              as={FormInput}
            />
          </div>

          <Field
            name={AccountFields.DateOfBirth}
            component={FormDatePicker}
            label="Date of Birth"
          />

          <Space direction='column'/>

          <div className="flex justify-between mt-12 sm:mt-24">
            <div/>

            <div className="flex flex-wrap-reverse justify-center">
              <div className="my-4 sm:my-0 mx-12">
                <LargeTextButton color='none' type='reset'>Cancel</LargeTextButton>
              </div>
              <div className="my-4 sm:my-0">
                <LargeTextButton color='primary' type='submit'>Save Changes</LargeTextButton>
              </div>
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default AccountForm;
