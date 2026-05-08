// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import Stripe from 'stripe';

//import { deletePayment, setDefaultPayment } from 'api/billing';
import AmExLogo from 'graphics/payments/american ex.png';
import MasterCardLogo from 'graphics/payments/mastercard.png';
import DefaultLogo from 'graphics/payments/stripe.png';
import VisaLogo from 'graphics/payments/visa.png';
import { HorizontalLine } from 'styles/Dividers';
import { Col, Row } from 'styles/Flex';
import { Space } from 'styles/layout';

//import { DefaultText, PaymentActions, PaymentContainer, PaymentDescription, PaymentTitle, ProviderLogo, RemoveText } from './styled';
import { PaymentActions, PaymentContainer, PaymentDescription, PaymentTitle, ProviderLogo } from './styled';

type Props = {
  card: Stripe.Card,
  id: string,
  isDefault: boolean
};

const BrandSwitch = (brand : string) => {
  switch (brand) {
    case 'visa':
      return VisaLogo;
    case 'mastercard':
      return MasterCardLogo;
    case 'american express':
      return AmExLogo;
    default:
      return DefaultLogo;
  }
};

// TODO: Both are required to shut up eslint
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
const PaymentMethodCard: React.FC<Props> = ({ card, id, isDefault }) => {

  /*
  const setDefault = () => {
    if (id) { setDefaultPayment(id);}
  };

  const removeCard = () => {
    if (id) { deletePayment(id);}
  };
  */

  return (
    <PaymentContainer>
      <Row>
        <ProviderLogo src={BrandSwitch(card.brand)} />
        <Space direction='row'/>
        <Col>
          <PaymentTitle>{card.brand.toUpperCase()} **** {card.last4}</PaymentTitle>
          <PaymentDescription>Expires {card.exp_month}/{card.exp_year}</PaymentDescription>
        </Col>
      </Row>
      <br/>
      <HorizontalLine width={'100%'} />
      <PaymentActions>
        {/*
        {!isDefault && <DefaultText onClick={setDefault}>Set Default</DefaultText>}
        {!isDefault && <RemoveText onClick={removeCard}>Remove</RemoveText>}
        */}
        {isDefault && <h5>Current Payment Method</h5>}
      </PaymentActions>
    </PaymentContainer>
  );
};

export default PaymentMethodCard;
