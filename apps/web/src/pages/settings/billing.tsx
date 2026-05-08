// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect, useState } from 'react';
import { ReactLayoutComponentType } from 'react-layout';
import Loading from 'react-loading';
import { useSelector } from 'react-redux';
import { toast, UpdateOptions } from 'react-toastify';
import Avatar from '@src/components/Avatar';
import { AvatarTypes } from '@src/components/Avatar/Avatar';
import useBilling from '@src/hooks/useBilling';
import Icons from '@src/icons';
import settingsLayout from '@src/layouts/settingsLayout';
import { updateBilling } from '@src/store/billingSlice';
import { SubscriptionWithCommunity } from '@src/types/billing';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, PaymentMethod, StripeElementsOptions } from '@stripe/stripe-js';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Stripe from 'stripe';
import { useTheme } from 'styled-components';

import { addSourceToCustomer, cancelSubscription, createNewStripeCustomer, getAllSubscriptions, getStripeCards, getStripeCustomer, SubscriptionUnion } from 'api/billing';
import CommunityIcon from 'components/CommunityIcon';
import Modal from 'components/ModalV2';
import AddPaymentMethod from 'components/Settings/AddPaymentMethod';
import PaymentMethodCard from 'components/Settings/PaymentMethod';
import { Container } from 'components/Settings/styledAgain';
import { APP } from 'pages';
import { changeCommunity } from 'store/communitySlice';
import { RootState, useAppDispatch } from 'store/store';
import { Button, IconButton, LargeTextButton } from 'styles/Buttons';
import { HorizontalLine } from 'styles/Dividers';
import { FlexSpaceBetween, FlexSpaceEvenly, OldCol, OldRow } from 'styles/Flex';
import { ColoredSpan, Icon } from 'styles/Globals';
import { Space } from 'styles/layout';

import CloseIcon from '../../../public/graphics/commonicons/close.svg';

// NEXT_PUBLIC_ prefix is required for Next.js to expose env vars to
// the browser. The legacy REACT_APP_ name was a CRA-era leftover and
// silently resolved to undefined here.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');


type StripeFormProps = {
  onSubmit : () => void,
  onSuccess : () => void,
};

const StripeForm:React.FC<StripeFormProps> = ({ onSubmit, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const theme = useTheme();

  //This is a crazy way they make you update the look of CardElement
  useEffect(() => {
    const customCard = elements?.getElement('card');
    customCard?.update(
      {
        style: {
          base: {
            fontSize: '18px',
            color: theme.fontPrimary,
            backgroundColor: theme.backgroundLight,
            lineHeight: '30px',
          },
        },
      });

  }, [elements]);


  const addCard = async () => {

    const cardElement = elements?.getElement('card');
    if (cardElement) {
      const result = await stripe?.createSource(cardElement, {
        type: 'card',
      });
      onSubmit(); //Close prompt
      const toastId = toast.loading('Attempting to add card');

      if (!result?.source?.id) {
        const update : UpdateOptions = {
          render: 'Missing Card information, please try again.',
          type: 'error',
          isLoading: false,
          autoClose: 5000,
        };
        toast.update(toastId, update);
        return;
      }
      
      //   Attach newly created source to customer
      addSourceToCustomer(result.source.id)
        .then((response) => {
          const update : UpdateOptions = {
            render: 'Success!',
            type: 'success',
            isLoading: false,
            autoClose: 5000,
          };
          toast.update(toastId, update);
          onSuccess();
          return response;
        })
        .catch((error) => {
          console.error(error);
          const update : UpdateOptions = {
            render: 'Failed to add payment!',
            type: 'error',
            isLoading: false,
            autoClose: 5000,
          };
          toast.update(toastId, update);
        });
    } else {
      toast.error('Missing Card information, please try again.');
    }
  };

  return (
    <OldCol $full>
      <h3>Secure - Add New Card</h3>
      <br/>
      <h6>Enter your payment details. Only US cards are accepted.</h6>
      <Space size='sm' direction='column'/>
      <CardElement />
      <Space size='sm' direction='column'/>
      <FlexSpaceEvenly $direction='row'>
        <Button color="none" onClick={onSubmit}>Cancel</Button><br />
        <Button color="primary" onClick={addCard}>Add Card</Button><br />
      </FlexSpaceEvenly>
    </OldCol>
  );
};

const Billing: ReactLayoutComponentType = () => {
  const uid = useSelector((state : RootState) => state.user.id);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const myBilling = useBilling();

  const [addPaymentModel, setAddPaymentModal] = useState(false);
  // const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithCommunity>();

  const options : StripeElementsOptions = {};

  const goToCommunity = async (communityId: string) => {
    //FIXME Dylan finish this
    throw new Error('Not Implemented');
    // await dispatch(changeCommunity(communityId));
    // router.push(APP.COMMUNITY.INDEX);
  };

  const handleCancelSubscription = async (sub: SubscriptionWithCommunity) => {
    //TODO add confirmation
    // setOpenConfirmModal(false);
    if (sub) {
      await myBilling.cancelSubscription(sub.stripeId);
      toast.info(`Cancelled subscription for ${sub.community.name}`);
    } else {
      toast.error('An error has occurred, contact support.');
    }
  };

  const generatePaymentMethods = (methods : Array<Stripe.PaymentMethod>) => {
    if (methods.length > 0) {
      return methods.map((method, index) => {
        if (method.card) {
          const card = (method.card as unknown) as Stripe.Card;
          return (
            <PaymentMethodCard key={index} card={card} id={method.id} isDefault={method.id === myBilling.customer?.defaultSource}/>
          );
        }
      });
    } else return <></>;
  };

  //TODO maek this into a table
  const generateSubscriptions = (subs: Array<SubscriptionWithCommunity>) => {
    if (subs?.length > 0) {
      return subs.map((sub) => {

        let communityName = sub.community.name || 'Community'; //sub.community?.name || 'Community';
        let subscriptionName = 'Subscription';
        let stripeValue : Stripe.Subscription;
        try {
          stripeValue = JSON.parse(sub.stripeValue);
        } catch (error) {
          console.error(error);
        }
        return (
          <>
            <FlexSpaceBetween key={`${sub.stripeId}`} $direction='row'>
              <OldRow>
                {/* TODO CommunityIcon needs to be updated */}
                {/* <CommunityIcon communityId={sub.community.id} onClick={()=>goToCommunity(sub.community.id)} /> */}
                <Space />
                <OldCol>
                  {/* TODO gotocommunity needs an update */}
                  <h3 onClick={() => goToCommunity(sub.community.fbid)}>{communityName}</h3>
                  <h6>{subscriptionName}</h6>
                </OldCol>
              </OldRow>
              {stripeValue &&
                <>
                  {stripeValue.canceled_at ?
                  <OldCol $center>
                    <h6>Cancelled</h6>
                    <h4>{stripeValue.canceled_at && (new Date(stripeValue.canceled_at * 1000).toDateString())}</h4>
                  </OldCol>
                    :
                  <OldCol $center>
                    <h6>Started</h6>
                    <h4>{stripeValue?.start_date && (new Date(stripeValue?.start_date * 1000).toDateString())}</h4>
                  </OldCol>}
              
              
                  <OldCol $center>
                    <h6>Status</h6>
                    <h4><ColoredSpan style={stripeValue.status === 'active' ? {} : { color: 'orange' }}>{stripeValue.status}</ColoredSpan></h4>
                  </OldCol>
        
                  <OldCol $center>
                    <h6>Amount</h6>
                    {/* @ts-ignore due to these fields missing from typed object FFS*/}
                    <h4>{stripeValue?.plan?.amount && `\$${stripeValue?.plan.amount / 100}`}</h4>
                  </OldCol>
                </>
                  
              }
              <IconButton color='backgroundLight' onClick={()=>{handleCancelSubscription(sub);}}>
                <Icon $solid $color='primary' as={CloseIcon} />
              </IconButton>
            </FlexSpaceBetween>
            <Space direction='column' />
          </>
        );
      });
    } else {
      return;
    }
  };

  return (
    <Container>

      {/*
      FIXME: Make a new confirm modal
      <Confirm
        message="Cancel Subscription?"
        noMessage="No"
        isOpen={openConfirmModal}
        onNo={() => setOpenConfirmModal(false)}
        onYes={() => handleCancelSubscription()}
      />
      */}

      <Modal
        open={addPaymentModel}
        handleClose={() => setAddPaymentModal(false)}
        shouldCloseOnOverlayClick={true}
      >
        <div className="mx-12 my-8">
        <Elements stripe={stripePromise} options={options}>
         <div style={{ width: '300px', margin: 'auto' }} >
           <StripeForm
            onSubmit={() => setAddPaymentModal(false)}
            onSuccess={() => {
              if (uid) myBilling.fetchAllBillingInfo();
            }}
           />
         </div>
       </Elements>
        </div>
      </Modal>

      { myBilling.isCustomer === undefined
        ? <Loading type='bubbles' /> 
        : myBilling.isCustomer
          ? <>
            <h1>Billing</h1>
            <Space direction='column'/>
            {/* TODO implement 'here' routing*/}
            <h6>
              This is the billing information for standard user accounts.<br />
              If you want to view your creator account, go to the next tab (Creator).
            </h6>
            <Space direction='column'/>
            <HorizontalLine />
            <Space direction='column'/>
            <h3>Payment methods</h3>
            <Space direction='column'/>
            <h6>
              This is your current payment method. <br /> 
              Adding a new payment method will remove your current payment method & switch to the new one.
            </h6>
            <Space direction='column' />
            <OldRow $wrap>
              {myBilling.methods && generatePaymentMethods(myBilling.methods)}
              <AddPaymentMethod handler={() => setAddPaymentModal(true)}/>
            </OldRow>
            <HorizontalLine />
            <Space direction='column' />
            <OldRow className='justify-between'>
              <h3>Subscriptions</h3>
              <IconButton color='backgroundLight' onClick={()=>{myBilling.fetchSubscriptions();}}>
                <Icons.Refresh />
              </IconButton>
            </OldRow>
            <h6>This is where your current and past subscriptions are found.</h6>
            <Space direction='column' />
            {myBilling.subscriptions && generateSubscriptions(myBilling.subscriptions)}
          </>  
          : <>
          <OldCol $center style={{ textAlign: 'center' }}>
            <h3>Billing Account is Required to continue.</h3>
            <h4>This is a standard user account, and will take approximately 2 minutes to setup.</h4>
            <Space direction='column' />
            <LargeTextButton color='primary' onClick={() => myBilling.createCustomer()}>
              Create Billing Account
            </LargeTextButton>

            <Space direction='column' size='lg' />
          </OldCol>
        </>
      }
    </Container>


  );
  // return (
  //   <>
  //     <h5>Stripe Testing</h5>
  //     <br/>
  //     <button onClick={testNewAccount}>Test New Express Account</button><br />
  //     <button onClick={testNewCustomer}>Test New Customer</button><br />
  //     <button onClick={testGetCards}>Test GetCards</button><br />
  //     <div>Current Payment Intent: {clientSecret} </div>
  //     <button onClick={testStagePayment}>Test StagePayment</button><br />
  //     <button onClick={testConfirmPayment}>Test ConfirmPayment</button><br />
  //     <br />
  //     <Elements stripe={stripePromise} >
  //       <div style={{ width: '400px', margin: 'auto' }} >
  //         <StripeForm />
  //       </div>
  //     </Elements>
  //   </>
  // );
};

Billing.Layout = settingsLayout;
export default Billing;
