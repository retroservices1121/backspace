// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import ReactLoading from 'react-loading';
import { toast } from 'react-toastify';
import settingsLayout from '@src/layouts/settingsLayout';
import Stripe from 'stripe';

import { createStripeAccount, getStripeCreator } from 'api/billing';
import { Container } from 'components/Settings/styledAgain';
import { ButtonLarge } from 'styles/Buttons';
import { OldCol } from 'styles/Flex';
import { Footer, Space } from 'styles/layout';
import { openInNewTab } from 'utils/common_utils';

const CreatorSettings: ReactLayoutComponentType = () => {
  const [stripeAccount, setStripeAccount] = useState<Stripe.Account | null>(null);
  const [link, setLink] = useState<Stripe.AccountLink | Stripe.LoginLink | null>(null);
  const [linkType, setLinkType] = useState<'onboarding' | 'dashboard' | null>(null);
  const [linkExpiration, setLinkExpiration] = useState<number | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);

  const refresh = async () => {
    setFetchLoading(true);
    const state = await getStripeCreator();
    setStripeAccount(state.account);
    setLink(state.link);
    setLinkType(state.linkType);
    setFetchLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  // Onboarding links from Stripe expire fast (a few minutes) — show
  // a countdown so the user knows when to re-request. Dashboard
  // login links don't carry an `expires_at`, so the countdown only
  // runs in the onboarding case.
  useEffect(() => {
    if (linkType !== 'onboarding' || !link || !('expires_at' in link)) {
      setLinkExpiration(null);
      return;
    }
    const expiresAt = link.expires_at;
    const tick = () => {
      const remaining = Math.round(expiresAt - Date.now() / 1000);
      setLinkExpiration(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [link, linkType]);

  const attemptCreateAccount = async () => {
    setCreateLoading(true);
    toast.info('Redirecting to payment partner. This will open a new tab.');
    const result = await createStripeAccount();
    if (result?.accountLink?.url) {
      openInNewTab(result.accountLink.url);
      // Refresh state so we move out of the no-account view.
      await refresh();
    }
    setCreateLoading(false);
  };

  const requestNewLink = async () => {
    await refresh();
    if (link && 'url' in link) openInNewTab(link.url);
  };

  const noAccount = () => (
    <OldCol $center $full style={{ textAlign: 'center' }}>
      <h1>Communities and Creators</h1>
      <br />
      <h4>Creator accounts require more information than a user account.</h4><br />
      <h4>Only do this if you intend on collecting money from subscriptions.</h4><br />
      <Space direction="column" />
      <ButtonLarge color="none" onClick={attemptCreateAccount}>
        Create Creator Account
      </ButtonLarge>
      <Space direction="column" />
      <h3>This requires SSN, US address, and 5–20 minutes to setup.</h3>
    </OldCol>
  );

  const continueSetup = () => {
    const dueActions = stripeAccount?.requirements?.currently_due ?? [];
    const linkValid = link && 'url' in link
      && (linkExpiration === null || linkExpiration > 0);
    return (
      <OldCol $center $full style={{ textAlign: 'center' }}>
        <h1>Communities and Creators</h1>
        <br />
        {stripeAccount?.email}
        <br />
        <p>Your account has been created but is missing some requirements:</p><br />
        <p>{dueActions.join(', ')}</p><br />
        <Space direction="column" />
        {linkValid ? (
          <>
            <ButtonLarge color="none" onClick={() => link && 'url' in link && openInNewTab(link.url)}>
              Continue to Setup
            </ButtonLarge>
            {linkExpiration !== null && (
              <h4>Link expires in {Math.max(0, linkExpiration)} seconds</h4>
            )}
          </>
        ) : (
          <ButtonLarge color="none" onClick={requestNewLink}>
            Request New Setup Link
          </ButtonLarge>
        )}
        <Space direction="column" />
        <p>You will be redirected to complete your account information in a secure portal.</p>
      </OldCol>
    );
  };

  const creatorAccount = () => (
    <OldCol $center $full>
      <h2>Your Creator Account</h2>
      <h6>{stripeAccount?.email}</h6>
      <br />
      <ButtonLarge color="none" onClick={requestNewLink}>
        Go To Dashboard
      </ButtonLarge>
      <Space direction="column" size="sm" />
      <h6>Insights and analytics coming soon…</h6>
      <Space direction="column" size="lg" />
    </OldCol>
  );

  const stateMachine = () => {
    if (!stripeAccount) return noAccount();
    const dueActions = stripeAccount.requirements?.currently_due ?? [];
    const onboarded = stripeAccount.charges_enabled
      && stripeAccount.payouts_enabled
      && dueActions.length === 0;
    return onboarded ? creatorAccount() : continueSetup();
  };

  return (
    <Container>
      {createLoading || fetchLoading ? <ReactLoading type="bubbles" /> : stateMachine()}
      <Footer>
        <h6 style={{ textAlign: 'center' }}>
          Actions on this page open new tabs in your browser. If you click a button and nothing happens, make sure to check your pop-up blocker.
        </h6>
      </Footer>
    </Container>
  );
};

CreatorSettings.Layout = settingsLayout;

export default CreatorSettings;
