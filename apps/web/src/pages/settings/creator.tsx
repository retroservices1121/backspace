// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import ReactLoading from 'react-loading';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import settingsLayout from '@src/layouts/settingsLayout';
import Stripe from 'stripe';

import { createStripeAccount, forceUpdateStripeAccount, getAccountLink, getLoginLink, getNewAccountLink, getStripeCreator } from 'api/billing';
import { Container } from 'components/Settings/styledAgain';
import { RootState } from 'store/store';
import { ButtonLarge  } from 'styles/Buttons';
import { OldCol } from 'styles/Flex';
import { Footer, Space } from 'styles/layout';
import { openInNewTab } from 'utils/common_utils';


const CreatorSettings: ReactLayoutComponentType = () => {
  const uid = useSelector((state: RootState) => state.user.id);
  const [stripeAccount, setStripeAccount] = useState<Stripe.Account | null>();
  const [accountLink, setAccountLink] = useState<Stripe.AccountLink | null>();
  const [linkExpiration, setLinkExpiration] = useState<number>();
  const [createLoading, setCreateLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  //FIXME implementation needed
  const updateCreator = async (userId: bigint) => {
    //TODO shouldn't need this if the fricken stripe webhooks work
    setFetchLoading(true);
    // const account = await forceUpdateStripeAccount(userId);
    // if (account) {
    //   setStripeAccount(account);
    // } else {
    //   await getStripeCreator(userId).then((result) => {
    //     setStripeAccount(result);
    //   });
    // }
    setFetchLoading(false);
  };

  //Attempts the create account and generates an accountLink
  const attemptCreateAccount = async () => {
    setCreateLoading(true);
    toast.info('Redirecting to payment partner. This will open a new tab.');
    await createStripeAccount().then((result) => {
      if (result) {
        setAccountLink(result);
      }
    }).catch((e) => {
      console.error(e);
      toast.error('Error creating a stripe account. Refresh page or contact support.');
    });
    setCreateLoading(false);
  };

  //If account, generates new account link
  const newAccountLink = () => {
    getNewAccountLink().then((result) => {
      if (result) {
        setAccountLink(result);
      }
    });
  };

  const gotoDashboard = async () => {
    setDashboardLoading(true);
    const link = await getLoginLink();
    if (link) {
      openInNewTab(link.url);
    } else {
      toast.error('An error has occurred, please contact support.');
    }
    setDashboardLoading(false);

  };

  let timer : ReturnType<typeof setTimeout>;
  const countdownExpiration = () => {
    clearTimeout(timer);
    if (accountLink) {
      const remainingSeconds = Math.round(accountLink.expires_at - (Date.now() / 1000));
      setLinkExpiration(remainingSeconds);
      if (remainingSeconds > 0) {
        timer = setTimeout(() => countdownExpiration(), 1000);
      }
    }
  };

  useEffect(() => {
    if (uid) {
      updateCreator(uid);
      //FIXME implement account link
      // getAccountLink(uid).then((result) => {
      //   setAccountLink(result);
      // });
    }
  }, [uid]);

  useEffect(() => {
    countdownExpiration();
  }, [accountLink]);


  const noAccount = () => {
    return (
      <OldCol $center $full style={{ textAlign: 'center' }}>
        <h1>Communities and Creators</h1>
        <br />
        <h4>Creator accounts require more information than a user account.</h4><br />
        <h4>Only do this if you intend on collecting money from subscriptions.</h4><br />
        
        <Space direction='column' />
        <ButtonLarge color='none' onClick={attemptCreateAccount}>Create Creator Account </ButtonLarge>
        <Space direction='column' />
        <h3>This requires SSN, US address, and 5-20 minutes to setup.</h3>

      </OldCol>
    );
  };

  const continueSetup = () => {
    const dueActions = stripeAccount?.requirements?.currently_due;
    return (
      <OldCol $center $full style={{ textAlign: 'center' }}>
        <h1>Communities and Creators</h1>
        <br />
        {stripeAccount?.email}
        <br />
        <p>Your Account has been created but is missing some requirements:</p><br />
        <p>{dueActions?.map((requirement) => {
          return requirement + ', ';
        })}</p><br />
        
        <Space direction='column' />
        {accountLink && linkExpiration && linkExpiration >= 0 ? 
          <>
            <ButtonLarge color='none' onClick={() => accountLink && openInNewTab(accountLink.url)}>Continue to Setup</ButtonLarge>
            {/* {accountLink?.url} */}
            <h4>Link expires in {linkExpiration  || '0'} seconds</h4>
          </>
          :
          <ButtonLarge color='none' onClick={() => newAccountLink()}>Request New Setup Link</ButtonLarge>
        }
        <Space direction='column' />
        <p>You will be redirected to complete you account information in a secure portal.</p>
        

      </OldCol>
    );
  };

  const creatorAccount = () => {
    return (
      <OldCol $center $full>
        <h2> Your Creator Account </h2>
        <h6>{stripeAccount?.email}</h6>
        <br />
        <ButtonLarge color='none' onClick={() => !dashboardLoading && gotoDashboard()}>
          {dashboardLoading ? 
            <>Loading...</>
            : <>Go To Dashboard</>}
        </ButtonLarge>
        <Space direction="column" size='sm' />
        <h6>Insights and Analytics coming soon...</h6>
        <Space direction="column" size='lg' />
        {/* <Col center>
          <h3>Manage Subscription</h3>
            

        </Col> */}
      </OldCol>
    );
  };

  const stateMachine = () => {
    if (stripeAccount) {
      const dueActions = stripeAccount.requirements?.currently_due;
      if (dueActions && dueActions.length > 0) {
        return continueSetup(); 
      } else {
        return creatorAccount();
      }
    } else {
      return noAccount();
    }
    
  };



  return (
    <Container>
      {createLoading || fetchLoading ? <ReactLoading type="bubbles" /> : stateMachine()}
      <Footer>
        <h6 style={{ textAlign: 'center' }}>Actions on this page open new tabs in your browser. If you click a button and nothing happens, make sure to check your pop-up blocker.</h6>
      </Footer> 
    </Container>
  );
};

CreatorSettings.Layout = settingsLayout;

export default CreatorSettings;
