// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import settingsLayout from '@src/layouts/settingsLayout';

import { updateUserPassword } from 'api/auth';
import SecurityForm from 'components/Settings/SecurityForm';
import { Container } from 'components/Settings/styledAgain';
import { RootState } from 'store/store';
import { Space } from 'styles/layout';
import { SecurityFields, SecurityFormState } from 'types/settings';
import { EMAIL_DOMAIN, SUPPORT_EMAIL } from 'utils/constants';

const Security: ReactLayoutComponentType = () => {
  const uid = useSelector((state : RootState) => state.user.id);

  const handleSubmit = async (form : SecurityFormState) => {
    //Try to update, if failed, have the user reautenticate and try again
    //https://firebase.google.com/docs/auth/web/manage-users#re-authenticate_a_user

    if (form[SecurityFields.NewPassword] && form[SecurityFields.ConfirmPassword]) {
      const result = await updateUserPassword(form[SecurityFields.NewPassword]);
      if (result) {
        toast.info('Successfully changed password');
      } else { //TODO Need to reauth. Prob display a reauth modal or something
        toast.error('Please logout and log back in.');
        toast.error('After logging back in, try again.');
      }
    }
  };

  return (
    <Container>
      <SecurityForm onSubmit={handleSubmit}/>
      <Space size="lg" direction="column" />
      <h3>Account Removal</h3>
      <br />
      <h6>To disable or delete your account, contact <a href={`mailto:${SUPPORT_EMAIL}@${EMAIL_DOMAIN}`}>{SUPPORT_EMAIL}@{EMAIL_DOMAIN}</a>.</h6>
      <h6>Add this unique id to your email: {uid}</h6>
    </Container>
  );
};

Security.Layout = settingsLayout;

export default Security;

