// Account credentials (email, password, linked wallets, MFA) are managed in
// the Privy account UI — this settings page only exposes the account-removal
// contact path now.
import React from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import { useSelector } from 'react-redux';
import settingsLayout from '@src/layouts/settingsLayout';

import { Container } from 'components/Settings/styledAgain';
import { RootState } from 'store/store';
import { Space } from 'styles/layout';
import { EMAIL_DOMAIN, SUPPORT_EMAIL } from 'utils/constants';

const Security: ReactLayoutComponentType = () => {
  const uid = useSelector((state: RootState) => state.user.id);

  return (
    <Container>
      <h3>Sign-in & credentials</h3>
      <h6>
        Email, password, linked wallets, and multi-factor settings are managed
        in your Privy account. Open the account menu in the top-right of the app
        to make changes.
      </h6>

      <Space size="lg" direction="column" />

      <h3>Account Removal</h3>
      <br />
      <h6>
        To disable or delete your account, contact{' '}
        <a href={`mailto:${SUPPORT_EMAIL}@${EMAIL_DOMAIN}`}>
          {SUPPORT_EMAIL}@{EMAIL_DOMAIN}
        </a>
        .
      </h6>
      <h6>Add this unique id to your email: {uid}</h6>
    </Container>
  );
};

Security.Layout = settingsLayout;

export default Security;
