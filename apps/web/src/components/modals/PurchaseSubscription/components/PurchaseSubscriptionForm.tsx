// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';
import ReactLoading from 'react-loading';
import { useSelector } from 'react-redux';
import { Field, Form, Formik } from 'formik';
import Stripe from 'stripe';
import * as Yup from 'yup';

import { AvatarTypes } from 'components/Avatar/Avatar';
import { RadioInput } from 'components/FormInput';
import { AvatarHeader } from 'components/UserHeader';
import useCommunity from 'hooks/entities/useCommunities';
import { useCommunityMedia } from 'hooks/getCommunityMedia';
import useStripe from 'hooks/useStripe';
import { RootState } from 'store/store';
import { Button } from 'styles/Buttons';
import { HorizontalLine } from 'styles/Dividers';
import { Flex, FlexSpaceBetween, OldCol } from 'styles/Flex';
import { FieldError } from 'styles/form';
import { Space } from 'styles/layout';
import { Price } from 'styles/text';
import { FormDebug } from 'utils/FormDebug';

import { BorderBox, Container, TertiarySpan } from '../styles';


// function getTax(price: number) {
//   // FIXME this is a placeholder
//   return 0 || price; // this makes typescript STFU
// }

function formatMoney(dollars: number) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
  return formatter.format(dollars);
}

function formatCard(card: Stripe.Card) {
  return `${card.brand.toUpperCase()} **** ${card.last4}`;
}

enum PurchaseFields {
  PaymentMethod = 'paymentMethod',
  Tier = 'tier',
}

export type PurchaseForm = {
  [PurchaseFields.PaymentMethod]: string;
  [PurchaseFields.Tier]: string;
};

const purchaseSchema = Yup.object().shape({
  [PurchaseFields.PaymentMethod]: Yup.string()
    .min(2, 'is too short.')
    .required(),
  [PurchaseFields.Tier]: Yup.string()
    .required(),
});

type Props = {
  onSubmit: (formState: PurchaseForm) => void;
  onEditPaymentMethods: () => void;
};

const PurchaseSubscription: React.FC<Props> = ({
  onSubmit, onEditPaymentMethods,
}) => {
  const { current: { community: { name, id } } } = useCommunity();
  //FIXME this id.toString is not correct
  const { profile } = useCommunityMedia(id.toString());
  const { paymentMethods } = useStripe();
  const [isLoading, setIsLoading] = useState<boolean>();

  //TODO remove this later
  //Simulate loading
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  //FIXME this is broken
  const tier = undefined;
  // const tier = useSelector((state: RootState) => state.community.premium_tiers?.[0]);

  return (
    <>
      {tier === undefined ?
        <OldCol $full $center>
          {isLoading ?
            <ReactLoading type='bubbles' />
            :
            <>
              <h3>No Subscription Options</h3>
              <Space direction='column' size='sm' />
              <h4>The creator needs to add premium tiers before this will be available.</h4>
              <Space direction='column' size='sm' />
              <h4>Message the community owner and encourage them to set up premium tiers.</h4>
            </>

          }
        </OldCol>
        :
        <Container>
          <Formik<PurchaseForm>
            initialValues={{
              paymentMethod: paymentMethods?.[0]?.id || '',
              tier: tier?.id,
            }}
            validationSchema={purchaseSchema}
            onSubmit={onSubmit}
          >
            {({ errors, dirty, isValid }) => (
              <Form>
                <FormDebug name="PurchaseSubscription" />
                <h1>Complete the Purchase</h1>
                <Space direction="column"/>
                <BorderBox>
                  <FlexSpaceBetween centerY>
                    <AvatarHeader
                      type={AvatarTypes.Community}
                      size={60}
                      image={profile}
                      title={name}
                      subtitle={tier?.title}
                    />

                    <Price value={formatMoney(Number(tier?.stripe_price?.unit_amount_decimal || 0) / 100)} />
                  </FlexSpaceBetween>

                  <Space direction="column"/>
                  <HorizontalLine/>
                  <Space direction="column"/>

                  <FlexSpaceBetween style={{ fontSize: '1.2em' }}>
                    <span>
                      {/* empty space */}
                    </span>

                    <div style={{ width: '50%' }}>
                      {/* <FlexSpaceBetween centerY>
                        <TertiarySpan>Price</TertiarySpan>
                        <span>{formatMoney(Number(tier?.stripe_price?.unit_amount_decimal || 0) / 100)}</span>
                      </FlexSpaceBetween> */}
                      {/* <FlexSpaceBetween centerY>
                        <TertiarySpan>Tax</TertiarySpan>
                        <span>{formatMoney(getTax(Number(tier?.stripe_price?.unit_amount || 0) / 100))}</span>
                      </FlexSpaceBetween> */}

                      {/* <HorizontalLine width="initial" /> */}

                      <FlexSpaceBetween centerY>
                        <TertiarySpan>Total</TertiarySpan>
                        <span>{formatMoney(Number(tier?.stripe_price?.unit_amount_decimal || 0) / 100)}</span>
                      </FlexSpaceBetween>

                    </div>
                  </FlexSpaceBetween>
                </BorderBox>

                <Space direction="column"/>

                <h2>Payment Method</h2>
                {/* TODO give header tags padding on the bottom */}
                <Space direction="column"/>

                <Flex>
                  {paymentMethods?.map((method, idx) => (
                    <Field
                      name={PurchaseFields.PaymentMethod}
                      value={method.id}
                      as={RadioInput}
                      key={idx}
                    >
                      {method?.card && formatCard((method.card as unknown) as Stripe.Card)}
                    </Field>
                  ))}
                  <Button color="none" onClick={onEditPaymentMethods}>
                    Edit
                  </Button>
                  { errors[PurchaseFields.PaymentMethod] && <FieldError>Please selected a payment method.</FieldError>}
                </Flex>


                <Space direction="column"/>
                <HorizontalLine width="initial" />
                <Space direction="column"/>

                <Button style={{ width: '100px' }} disabled={!dirty || !isValid} type='submit'>
                  Subscribe
                </Button>
              </Form>
            )}
          </Formik>
        </Container>
      }
    </>
  );
};
export default PurchaseSubscription;
