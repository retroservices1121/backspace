// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useMemo } from 'react';
import ReactLoading from 'react-loading';
import { Field, Form, Formik } from 'formik';
import Stripe from 'stripe';
import * as Yup from 'yup';

import { AvatarTypes } from 'components/Avatar/Avatar';
import { RadioInput } from 'components/FormInput';
import { AvatarHeader } from 'components/UserHeader';
import useCommunity from 'hooks/entities/useCommunities';
import { useCommunityBilling, CommunityTier } from '@src/hooks/useCommunityBilling';
import { useCommunityMedia } from 'hooks/getCommunityMedia';
import useStripe from 'hooks/useStripe';
import { Button } from 'styles/Buttons';
import { HorizontalLine } from 'styles/Dividers';
import { Flex, FlexSpaceBetween, OldCol } from 'styles/Flex';
import { FieldError } from 'styles/form';
import { Space } from 'styles/layout';
import { Price } from 'styles/text';
import { FormDebug } from 'utils/FormDebug';

import { BorderBox, Container, TertiarySpan } from '../styles';

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
  // The form's `tier` value carries the Stripe price ID directly so
  // the submit handler can pass it straight through to
  // POST /api/billing/subscription as `priceId`.
  Tier = 'tier',
}

export type PurchaseForm = {
  [PurchaseFields.PaymentMethod]: string;
  [PurchaseFields.Tier]: string;
};

export type PurchaseSubmit = PurchaseForm & {
  communityId: string;
  accountId: string;
};

const purchaseSchema = Yup.object().shape({
  [PurchaseFields.PaymentMethod]: Yup.string().min(2, 'is too short.').required(),
  [PurchaseFields.Tier]: Yup.string().required(),
});

type Props = {
  onSubmit: (formState: PurchaseSubmit) => void;
  onEditPaymentMethods: () => void;
};

const PurchaseSubscription: React.FC<Props> = ({
  onSubmit, onEditPaymentMethods,
}) => {
  const { current: { community: { name, id } } } = useCommunity();
  const { profile } = useCommunityMedia(id.toString());
  const { paymentMethods } = useStripe();
  const billing = useCommunityBilling(id);

  // Only tiers with a Stripe price are actually purchasable. Tiers
  // without one render in the list disabled (creator hasn't published
  // them yet) instead of being hidden, so the purchase modal is
  // self-explanatory rather than mysteriously empty.
  const purchasableTiers = useMemo(
    () => (billing.data?.tiers ?? []).filter((t) => t.stripePriceId !== null),
    [billing.data],
  );
  const tiers = billing.data?.tiers ?? [];
  const ownerAccountId = billing.data?.ownerAccountId ?? null;

  if (billing.loading) {
    return (
      <OldCol $full $center>
        <ReactLoading type="bubbles" />
      </OldCol>
    );
  }

  // Two reasons the purchase flow can't proceed:
  //   - Creator hasn't onboarded a Stripe Connect account yet.
  //   - Creator has no published tiers (or none with a Stripe price).
  // Show different copy for each so the creator/user can act on it.
  if (!ownerAccountId) {
    return (
      <OldCol $full $center>
        <h3>Subscriptions Unavailable</h3>
        <Space direction="column" size="sm" />
        <h4>The creator hasn’t set up payouts yet.</h4>
        <Space direction="column" size="sm" />
        <h4>Message the community owner and encourage them to finish billing setup.</h4>
      </OldCol>
    );
  }

  if (purchasableTiers.length === 0) {
    return (
      <OldCol $full $center>
        <h3>No Subscription Options</h3>
        <Space direction="column" size="sm" />
        <h4>The creator needs to add premium tiers before this will be available.</h4>
        <Space direction="column" size="sm" />
        <h4>Message the community owner and encourage them to set up premium tiers.</h4>
      </OldCol>
    );
  }

  const initialPriceId = purchasableTiers[0]?.stripePriceId ?? '';

  const handleSubmit = (values: PurchaseForm) => {
    onSubmit({
      ...values,
      communityId: id.toString(),
      accountId: ownerAccountId,
    });
  };

  return (
    <Container>
      <Formik<PurchaseForm>
        initialValues={{
          paymentMethod: paymentMethods?.[0]?.id || '',
          tier: initialPriceId,
        }}
        validationSchema={purchaseSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, isValid }) => {
          const selected = purchasableTiers.find((t) => t.stripePriceId === values.tier);

          return (
            <Form>
              <FormDebug name="PurchaseSubscription" />
              <h1>Complete the Purchase</h1>
              <Space direction="column" />

              <BorderBox>
                <FlexSpaceBetween centerY>
                  <AvatarHeader
                    type={AvatarTypes.Community}
                    size={60}
                    image={profile}
                    title={name}
                    subtitle={selected?.title}
                  />
                  <Price value={formatMoney(selected?.price ?? 0)} />
                </FlexSpaceBetween>

                <Space direction="column" />
                <HorizontalLine />
                <Space direction="column" />

                <FlexSpaceBetween style={{ fontSize: '1.2em' }}>
                  <span />
                  <div style={{ width: '50%' }}>
                    <FlexSpaceBetween centerY>
                      <TertiarySpan>Total</TertiarySpan>
                      <span>{formatMoney(selected?.price ?? 0)}</span>
                    </FlexSpaceBetween>
                  </div>
                </FlexSpaceBetween>
              </BorderBox>

              <Space direction="column" />

              <h2>Tier</h2>
              <Space direction="column" />

              <Flex>
                {tiers.map((t: CommunityTier, idx: number) => {
                  const purchasable = t.stripePriceId !== null;
                  const value = t.stripePriceId ?? `unavailable:${t.uuid}`;
                  return (
                    <Field
                      name={PurchaseFields.Tier}
                      value={value}
                      as={RadioInput}
                      key={t.uuid}
                      disabled={!purchasable}
                    >
                      {t.title} — {formatMoney(t.price)}
                      {!purchasable && ' (coming soon)'}
                    </Field>
                  );
                })}
                {errors[PurchaseFields.Tier] && <FieldError>Please select a tier.</FieldError>}
              </Flex>

              <Space direction="column" />

              <h2>Payment Method</h2>
              <Space direction="column" />

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
                {errors[PurchaseFields.PaymentMethod] && (
                  <FieldError>Please select a payment method.</FieldError>
                )}
              </Flex>

              <Space direction="column" />
              <HorizontalLine width="initial" />
              <Space direction="column" />

              <Button
                style={{ width: '100px' }}
                disabled={!isValid || !selected || !values.paymentMethod}
                type="submit"
              >
                Subscribe
              </Button>
            </Form>
          );
        }}
      </Formik>
    </Container>
  );
};
export default PurchaseSubscription;
