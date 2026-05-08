// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Field, Form, Formik } from 'formik';
import Icons from 'icons';
import * as Yup from 'yup';

import { ErrorMessage } from 'components/FormInput';
import Select from 'components/Select';
import { Option } from 'components/Select/types';
import useStripeAccount from 'hooks/useStripeAccount';
import { openInNewTab } from 'shared/common_utils';
import { ButtonLarge  } from 'styles/Buttons';
import { HorizontalLine } from 'styles/Dividers';
import { Col } from 'styles/Flex';
import { Footer } from 'styles/layout';
import { StripeCountries, StripeCreateFields, StripeCreateState } from 'types/stripeAccount';

import { Container } from './styled';

export const countryOptions = () => {
  const countryArray : Option[] = [];
  for (const key in StripeCountries) {
    if (Object.prototype.hasOwnProperty.call(StripeCountries, key)) {
      // @ts-ignore
      countryArray.push({ value: StripeCountries[key], label: key });
    }
  }
  return countryArray;
};

const stepComplete = (value: boolean) => {
  if (value){
    return <Icons.Check color={'primary'} />;
  } else {
    return <Icons.Close color={'error'} />;
  }
};


const CreatorSettings: React.FC<any> = () => {
  const stripeAccount = useStripeAccount();
  const [processing, setProcessing] = useState<boolean>(true);

  useEffect(() => {
    if (stripeAccount.account.value === null || stripeAccount.account.value) {
      setProcessing(false);
    }
  }, [stripeAccount.account.value]);

  const newAccount = async (formState: StripeCreateState) => {
    setProcessing(true);
    await stripeAccount.account.new(formState);
    setProcessing(false);
  };

  const gotoSetup = async () => {
    setProcessing(true);
    if (stripeAccount.link.value) {
      openInNewTab(stripeAccount.link.value.url);
    } else {
      if (stripeAccount.account.value) {
        const link = await stripeAccount.link.new();
        if (link) {
          openInNewTab(link.url);
        }
        toast.error('Unable to go to setup, refresh page.');  
      }
      toast.error('Unable to go to setup, refresh page.');
    } 
    setProcessing(false);
  };

  const gotoDashboard = async () => {
    setProcessing(true);
    if (stripeAccount.dashboard.value) {
      openInNewTab(stripeAccount.dashboard.value.url);
    } else {
      toast.error('Unable to go to dashboard, refresh page.');
    } 
    setProcessing(false);
  };

  const showAction = () => {
    if (stripeAccount.account.value) {
      if (stripeAccount.account.setupComplete) {
        // ### ACCOUNT SETUP COMPLETE
        return (
          <div>
            <ButtonLarge
              className='my-5 mx-auto' 
              disabled={processing}
              onClick={gotoDashboard} >
              Dashboard
            </ButtonLarge>
            <h6 className='break-all text-center w-full'>
              {stripeAccount.dashboard.value?.url}
            </h6>
            <br/><br/>
            <h6 className='text-center w-full'> Visit the above link to see analytics on your account.</h6>
          </div>
        );
      } else { 
        // ### ACCOUNT SETUP NEEDED
        return (
          <div>
            <h3 className='mb-5 text-center'>Finish Setup</h3>
            <p className='text-center'>
              Here, you'll go to Stripe to complete your account setup.
              Click the button below to continue, or copy-paste the link.
              <ButtonLarge 
                className='my-5 mx-auto' 
                disabled={processing}
                onClick={gotoSetup}
                >
                  {processing ? 'Loading' : 'Continue to Setup'}
              </ButtonLarge>
              <h6 className='break-all text-center w-full'>{stripeAccount.link.value?.url}</h6>
              <h6 className='break-all text-center w-full'>{stripeAccount.link.value && `Link will reset in ${stripeAccount.link.timer} seconds`}</h6>
              <br />
              This will take approximately 5-20 minutes and will information such as your SSN and US Address.
            </p>
          </div>
        );
      }
    } else {
      // ### ACCOUNT CREATION NEEDED
      const ctryOptions = countryOptions();
      const initialCreateState : StripeCreateState = {
        [StripeCreateFields.country]: { value: StripeCountries.United_States, label: 'United_States' },
      };
      const formSchema = Yup.object().shape({
        [StripeCreateFields.country]: Yup.object()
          .required('Required'),
      });
      return (
        <div>
          <h3 className='mb-5 text-center'>Create Your Account</h3>
          <p className='text-center'>
            The first step is to make your <strong>creator</strong> account.
            If you don't finish, we'll try to save your progress.

            <Formik 
              initialValues={initialCreateState} 
              validationSchema={formSchema}
              onSubmit={(values) => {
                newAccount(values);
              } }>
                {() => (
                  <Form>
                  <Col $center>
                    <Field
                      name={StripeCreateFields.country}
                      component={Select}
                      placeholder={'Select Country'}
                      options={ctryOptions}
                    />
                    <ButtonLarge 
                    className='my-5 mx-auto' 
                    disabled={processing}
                    type='submit'
                    >
                      {processing ? 'Loading' : 'Create Account'}
                    </ButtonLarge>
                    <ErrorMessage name={StripeCreateFields.country}>
                      {msg => `Country ${msg}`}
                    </ErrorMessage>
                  </Col>
                </Form>
                )}
                
            </Formik>
            
            This will take approximately 5-20 minutes and will information such as your SSN (USA) and Address.
          </p>
        </div>  
      );
    }
  };

  const setup = () => {
    return (
      <div className='flex flex-row-reverse justify-between flex-wrap w-full'>
        <div className='mx-auto mb-5 border-2 rounded-xl p-5 w-full h-fit sm:w-fit sm:min-w-fit'>
          <h3 className='mb-6'>Creator Account Progress</h3>
          <div className='flex flex-row'>
            {stepComplete(stripeAccount.account.value ? true : false)}
            <h4 className='my-auto'>Create Account</h4>
          </div>
          <HorizontalLine />
          <div className='flex flex-row'>
            {stepComplete(stripeAccount.account.setupComplete ? true : false)}
            <h4 className='my-auto cursor-pointer' onClick={gotoSetup}>Setup Account</h4>
          </div>
          <HorizontalLine />
          <div className='flex flex-row'>
            {stepComplete(stripeAccount.account.setupComplete ? true : false)}
            <h4 className='my-auto'>Creator Dashboard</h4>
          </div>
        </div>
        <div className='w-full sm:w-2/3 m-auto justify-center'>
          {showAction()}
        </div>
      </div>
      
    );
  };


  return (
    <Container>
      {setup()}
      <Footer>
        <h6 style={{ textAlign: 'center' }}>Actions on this page open new tabs in your browser. If you click a button and nothing happens, make sure to check your pop-up blocker.</h6>
      </Footer> 
    </Container>
  );
};
export default CreatorSettings;
