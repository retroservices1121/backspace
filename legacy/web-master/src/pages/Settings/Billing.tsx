// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import Loading from 'react-loading';
import { useDispatch, useSelector } from 'react-redux';
import { toast, UpdateOptions } from 'react-toastify';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, PaymentMethod, StripeElementsOptions } from '@stripe/stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';
import Icons from 'icons';
import Stripe from 'stripe';
import { useTheme } from 'styled-components';

import { cancelSubscription, getStripeCards, getStripeCustomer, SubscriptionUnion } from 'api/billing';
import CommunityIcon from 'components/CommunityIcon';
import Modal, { Confirm } from 'components/Modal';
import useRouting from 'hooks/useRouting';
import useStripeCustomer from 'hooks/useStripeCustomer';
import { APP } from 'pages';
import { changeCommunity } from 'store/communitySlice';
import { RootState } from 'store/store';
import { Button, IconButton } from 'styles/Buttons';
import { HorizontalLine } from 'styles/Dividers';
import { Col, FlexSpaceBetween, FlexSpaceEvenly, Row } from 'styles/Flex';
import { ColoredSpan } from 'styles/Globals';
import { Space } from 'styles/layout';

import AddPaymentMethod from './components/AddPaymentMethod';
import PaymentMethodCard from './components/PaymentMethod';
import { Container } from './styled';

//TODO move stripe public key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_KEY || '');


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
      const functions = getFunctions();
      const addSourceToCustomer = httpsCallable(functions, 'addSourceToCustomer');
      addSourceToCustomer(result.source.id)
        .then((response) => {
          // Read result of the Cloud Function.
          const data = response.data;
          
          const update : UpdateOptions = {
            render: 'Success!',
            type: 'success',
            isLoading: false,
            autoClose: 5000,
          };
          toast.update(toastId, update);
          onSuccess();
          return data;
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
    <Col $full>
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
    </Col>
  );
};

const Billing: React.FC<any> = () => {
  const uid = useSelector((state : RootState) => state.user.id);
  const dispatch = useDispatch();
  const history = useRouting();
  const myStripeCustomer = useStripeCustomer();
  // const [clientSecret, setClientSecret] = useState(''); //For staging payments
  const [customerLoader, setCustomerLoader] = useState(true);
  const [paymentMethodLoader, setPaymentMethodLoader] = useState(true);
  const [stripeCustomer, setStripeCustomer] = useState<Stripe.Customer | null>(null);
  const [stripeCards, setStripeCards] = useState<Array<PaymentMethod>>([]);
  // const [subscriptionLoader, setSubscriptionLoader] = useState(false);
  const [addPaymentModel, setAddPaymentModal] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionUnion>();

  const options : StripeElementsOptions = {};

  const goToCommunity = async (communityId: string) => {
    await dispatch(changeCommunity(communityId));
    history.navigate(APP.COMMUNITY.INDEX);
  };

  const handleCancelSubscription = async () => {
    setOpenConfirmModal(false);
    console.log(selectedSubscription);
    const toastId = toast.loading('Cancelling Subscription');
    if (selectedSubscription) {
      try {
        await cancelSubscription(selectedSubscription.id, selectedSubscription.community.id);  
        toast.update(toastId, {
          render:`Cancelled subscription for ${selectedSubscription.community.name}`,
          type:'success',
          autoClose: 3000,
          isLoading: false,
        });
      } catch (error) {
        toast.update(toastId, {
          render:'An error has occurred, contact support or try again.',
          type:'error',
          autoClose: 3000,
          isLoading: false,
        });
      }
      
    } else {
      toast.update(toastId, {
        render:'An error has occurred, contact support.',
        type:'error',
        autoClose: 3000,
        isLoading: false,
      });
    }
    await myStripeCustomer.subscriptions.get();
  };

  // const updateSubscriptions = async () => {
  //   setSubscriptionLoader(true);
  //   await myStripeCustomer.subscriptions.get();
  //   setSubscriptionLoader(false);
  // };

  const updateCustomer = (userId: string) => {
    getStripeCustomer(userId).then((result) => {
      setStripeCustomer(result);
      setCustomerLoader(false);
      setPaymentMethodLoader(true);
      myStripeCustomer.subscriptions.get();
    });
  };

  const updateCards = () => {
    setPaymentMethodLoader(true);
    getStripeCards().then((result) => {
      if (result) {
        setStripeCards(result);
      }
      setPaymentMethodLoader(false);
    });
  };

  useEffect(() => {
    if (uid) {
      myStripeCustomer.customer.sync();
      updateCustomer(uid);
      updateCards();
    }
  }, [uid]);

  const generatePaymentMethods = (methods : Array<PaymentMethod>) => {
    if (methods.length > 0) {
      return methods.map((method, index) => {
        if (method.card) {
          const card = (method.card as unknown) as Stripe.Card;
          return (
            <PaymentMethodCard key={index} card={card} id={method.id} isDefault={method.id === stripeCustomer?.default_source}/>
          );
        }
      });
    } else return <></>;
  };

  //TODO maek this into a table
  const generateSubscriptions = (subs: Array<SubscriptionUnion>) => {
    if (subs?.length > 0) {
      const sortedSubs = subs.sort((a, b) => {
        if (a.created > b.created) return -1;
        else if (a.created < b.created) return 1;
        else return 0;
      });
      return sortedSubs.map((sub) => {

        let communityName = sub.community?.name || 'Community';
        let subscriptionName = 'Subscription';
        //@ts-ignore colliding webhooks I don't have time to fix
        let plan = sub?.plan;
        let time = sub?.created ? new Date(sub.created * 1000) : null;
        try {
          return (
            <>
              <FlexSpaceBetween $direction='row' key={`sub-${sub.id}`}>
                <Row>
                  <CommunityIcon communityId={sub.community.id} handler={()=>goToCommunity(sub.community.id)} />
                  <Space />
                  <Col>
                    <h3>{communityName}</h3>
                    <h6>{subscriptionName}</h6>
                  </Col>
                </Row>
                <Col $center>
                  <h6>Started</h6>
                  {/* @ts-ignore sub.created type is wrong */}
                  <h4>{time && (time)?.toDateString()}</h4>
                </Col>
                <Col $center>
                  <h6>Status</h6>
                  {sub?.status === 'active' 
                    ? <h4><ColoredSpan>{sub.status}</ColoredSpan></h4>
                    : <h4>{sub.status}</h4>
                  }
                </Col>
                {/* @ts-ignore due to these fields missing from typed object FFS*/}
                {plan &&
                  <>
                    <Col $center>
                      <h6>Amount</h6>
                      {/* @ts-ignore due to these fields missing from typed object FFS*/}
                      <h4>{plan?.amount && `\$${plan.amount / 100}`}</h4>
                    </Col>
                    <Col $center>
                      <h6>Frequency</h6>
                      {/* @ts-ignore due to these fields missing from typed object FFS*/}
                      <h4>{plan?.interval}ly</h4>
                    </Col>
                  </>
                }
                {sub.status === 'active' 
                  ? <IconButton color='backgroundLight' onClick={()=>{setSelectedSubscription(sub); setOpenConfirmModal(true);}}>
                      <Icons.Close color='primary' />
                    </IconButton>
                  : <IconButton color='backgroundLight' onClick={()=>{goToCommunity(sub.community.id);}}>
                      <Icons.Menu color='primary' />
                    </IconButton>
                }
                
              </FlexSpaceBetween>
              <Space direction='column' />
            </>
          );
        } catch (error) {
          console.error('error rendering sub');
        }
      });
        
    } else {
      return;
    }
  };

  return (
    <Container>
      <Helmet>
        <meta charSet="utf-8" />
        <title>Billing</title>
      </Helmet>

      <Confirm
        message="Cancel Subscription? You will immediately lose access."
        noMessage="No"
        isOpen={openConfirmModal}
        onNo={() => setOpenConfirmModal(false)}
        onYes={() => handleCancelSubscription()}
      />

      <Modal
        isOpen={addPaymentModel}
        onRequestClose={() => setAddPaymentModal(false)}
        shouldCloseOnOverlayClick={true}
        style={{
          content:{
            display: 'flex',
            justifyContent:'center',
            alignItems:'center',
            margin: 'auto',
            padding: '30px',
            height: 'fit-content',
            minHeight: '200px',
            maxHeight: '100vh',
            width: 'fit-content',
            maxWidth: '100vw',
          },
        }}
      >
        <Elements stripe={stripePromise} options={options}>
         <div style={{ width: '300px', margin: 'auto' }} >
           <StripeForm
            onSubmit={() => setAddPaymentModal(false)}
            onSuccess={() => {
              if (uid) myStripeCustomer.customer.sync();
              updateCards();
            }}
           />
         </div>
       </Elements>
      </Modal>

      { myStripeCustomer.customer.id ?
      <>
        <h1>Billing</h1>
        <Space direction='column'/>
        {/* TODO implement 'here' routing*/}
        <h6>This is the billing information for standard user accounts.<br />If you want to view your creator account, go to the next tab (Creator).</h6>
        <Space direction='column'/>
        <HorizontalLine />
        <Space direction='column'/>
        <h3>Payment methods</h3>
        <Space direction='column'/>
        {/* <h6>These are your currently linked payment methods. You may remove or add a new payment method. Changing a payment method will only affect future charges.</h6> */}
        <h6>This is your current payment method. Adding a new payment method will remove your current payment method & switch to the new one.</h6>
        <Space direction='column' />
        <Row $wrap>
          {paymentMethodLoader ? <Loading type='bubbles' /> : generatePaymentMethods(stripeCards)}
          <AddPaymentMethod handler={() => setAddPaymentModal(true)}/>
        </Row>
        <HorizontalLine />
        <Space direction='column' />
        <h3>Subscriptions</h3>
        <h6>This is where your current and past subscriptions are found.</h6>
        <Space direction='column' />
        {generateSubscriptions(myStripeCustomer.subscriptions.value)}
      </> 
        : (customerLoader && <Loading type='bubbles' />) ||
      <>
        <Col $center style={{ textAlign: 'center' }}>
          <h3>Billing Account is Required to continue.</h3>
          <h4>This is a standard user account, and will take approximately 2 minutes to setup.</h4>
          <Space direction='column' />
          <p>Try refreshing your page. If you still see this notice, contact support@backspacethat.com</p>
          <p>id: {myStripeCustomer.customer.id || 'missing'}</p>
          <Space direction='column' size='lg' />
        </Col>
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
export default Billing;
