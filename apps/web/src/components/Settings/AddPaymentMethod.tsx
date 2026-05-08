// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';

import { Icon } from 'styles/Globals';
import { Space } from 'styles/layout';

import AddIcon from '../../../public/graphics/navigation/post.svg';
import { AddPaymentContainer } from './styled';

type Props = {
  handler: () => void;
};

const AddPaymentMethod: React.FC<Props> = ({ handler }) => {

  return (
    <AddPaymentContainer onClick={() => handler()}>
      <Icon $solid as={AddIcon} $color='primary' />
      <Space direction='column' size='sm' />
      Change Payment Method
    </AddPaymentContainer>
  );
};

export default AddPaymentMethod;
