// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useMedia from '@src/hooks/useMedia';
import useUser from '@src/hooks/useUser';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as Yup from 'yup';

import { FormDatePicker } from 'components/DatePicker/DatePicker';
import FormInput from 'components/FormInput';
import UploadBanner from 'components/Settings/UploadBanner';
import UsernameInput from 'components/UsernameInput';
import { FormType } from 'types/forms';
import { AccountFields, AccountFormState } from 'types/settings';
import { FormDebug } from 'utils/FormDebug';

import { ImageHeader } from './styledAgain';
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
  const { user, avatar } = useUser();
  const banner = useMedia(user?.banner);

  let INITIAL_STATE: AccountFormState = {
    [AccountFields.ProfilePic]: null,
    [AccountFields.BannerPic]: null,
    [AccountFields.Username]: user.username,
    [AccountFields.DisplayName]: user?.name || '',
    [AccountFields.Firstname]: user?.private?.firstName || '',
    [AccountFields.Lastname]: user?.private?.lastName || '',
    [AccountFields.Description]: user.bio || '',
    [AccountFields.Email]: user?.private?.email || '',
    [AccountFields.PhoneNumber]: user?.private?.phone || '',
    [AccountFields.DateOfBirth]: undefined,
  };

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      initialValues={INITIAL_STATE}
      validationSchema={AccountSchema}
    >
      {({  }) => (
        <Form className="flex flex-col gap-5 font-display text-ink">
          <FormDebug name="User Account Settings" />

          {/* Banner + avatar upload — kept in the original styled
              wrapper since UploadBanner / UploadPfp control their
              own surface. The card around it just provides padding
              on the new tokens. */}
          <section className="rounded-[14px] border border-line bg-surface p-5">
            <ImageHeader>
              <Field name={AccountFields.BannerPic} component={UploadBanner} preview={banner} />
              <Field name={AccountFields.ProfilePic} component={UploadPfp} preview={avatar} />
            </ImageHeader>
          </section>

          <section className="rounded-[14px] border border-line bg-surface p-5">
            <h2 className="m-0 text-[18px] font-semibold tracking-[-0.01em] text-ink">Profile</h2>
            <p className="mt-1.5 text-[13px] text-ink-3 leading-snug">
              Your public account information. This is how people will see, interact, and know you.
            </p>

            <div className="mt-4 grid sm:grid-cols-2 sm:gap-6 gap-3">
              <div>
                <Field
                  name={AccountFields.DisplayName}
                  label="Display Name"
                  placeholder="Elon"
                  as={FormInput}
                />
                <FieldError name={AccountFields.DisplayName}>display name</FieldError>
              </div>
              <div>
                <Field
                  name={AccountFields.Username}
                  label="Username"
                  placeholder="ElonMuskFan420"
                  as={UsernameInput}
                />
                <FieldError name={AccountFields.Username}>username</FieldError>
              </div>
            </div>

            <div className="mt-4">
              <Field
                name={AccountFields.Description}
                label="About You"
                placeholder="Tell us about yourself"
                as={FormInput}
              />
            </div>
          </section>

          <section className="rounded-[14px] border border-line bg-surface p-5">
            <h2 className="m-0 text-[18px] font-semibold tracking-[-0.01em] text-ink">
              Personal Information
            </h2>
            <p className="mt-1.5 text-[13px] text-ink-3 leading-snug">
              This information will NOT be publicly accessible.
            </p>

            <div className="mt-4 grid sm:grid-cols-2 sm:gap-6 gap-3">
              <div>
                <Field
                  name={AccountFields.Firstname}
                  label="First Name"
                  placeholder="Nikola"
                  as={FormInput}
                />
                <FieldError name={AccountFields.Firstname}>first name</FieldError>
              </div>
              <div>
                <Field
                  name={AccountFields.Lastname}
                  label="Last Name"
                  placeholder="Tesla"
                  as={FormInput}
                />
                <FieldError name={AccountFields.Lastname}>last name</FieldError>
              </div>
            </div>

            <div className="mt-4 grid sm:grid-cols-2 sm:gap-6 gap-3">
              <div>
                <Field
                  readonly
                  name={AccountFields.Email}
                  label="Email"
                  placeholder="you@email.com"
                  as={FormInput}
                />
                <FieldError name={AccountFields.Email} />
              </div>
              <div>
                <Field
                  name={AccountFields.PhoneNumber}
                  label="Phone Number"
                  placeholder="555-555-0123"
                  as={FormInput}
                />
              </div>
            </div>

            <div className="mt-4">
              <Field
                name={AccountFields.DateOfBirth}
                component={FormDatePicker}
                label="Date of Birth"
              />
            </div>
          </section>

          <div className="flex items-center justify-end gap-3 px-1">
            <button
              type="reset"
              className="
                rounded-full border border-line-2 text-ink text-[14px] font-semibold
                h-10 px-5 hover:bg-hover transition-colors
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              className="
                rounded-full bg-brand hover:bg-brand-2
                text-ink text-[14px] font-semibold
                h-10 px-5
                transition-colors duration-150
                shadow-[0_8px_22px_-6px_rgba(88,34,251,0.55)]
              "
            >
              Save Changes
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

// Small wrapper around Formik's ErrorMessage so the field-name
// prefix renders in the new token's pink-2 instead of inheriting
// whatever wrapping text color was around.
function FieldError({ name, children }: { name: string; children?: React.ReactNode }) {
  return (
    <ErrorMessage name={name}>
      {(msg) => (
        <div className="mt-1 text-[12px] text-pink-2 font-mono">
          {children ? <>{children} {msg}</> : msg}
        </div>
      )}
    </ErrorMessage>
  );
}

export default AccountForm;
