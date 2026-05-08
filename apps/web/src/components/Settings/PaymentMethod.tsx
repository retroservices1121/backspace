// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import Image from 'next/image';
import Stripe from 'stripe';

import { HorizontalLine } from 'styles/Dividers';
import { OldCol, OldRow } from 'styles/Flex';
import { Space } from 'styles/layout';

//import { deletePayment, setDefaultPayment } from 'api/billing';
import AmExLogo from '../../../public/graphics/payments/american ex.png';
import MasterCardLogo from '../../../public/graphics/payments/mastercard.png';
import DefaultLogo from '../../../public/graphics/payments/stripe.png';
import VisaLogo from '../../../public/graphics/payments/visa.png';
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
      <OldRow>
        <Image src={BrandSwitch(card.brand)} />
        <Space direction='row'/>
        <OldCol>
          <PaymentTitle>{card.brand.toUpperCase()} **** {card.last4}</PaymentTitle>
          <PaymentDescription>Expires {card.exp_month}/{card.exp_year}</PaymentDescription>
        </OldCol>
      </OldRow>
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
