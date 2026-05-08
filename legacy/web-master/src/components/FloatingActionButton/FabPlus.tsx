// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import Icons from 'icons';

import FloatingActionButton from '.';
import { FabProps } from './FloatingActionButton';


const FabPlus: React.FC<FabProps> = ({
  ...props
}) => {

  return (
    <FloatingActionButton {...props}>
      <Icons.Plus />
    </FloatingActionButton>
  );
};

export default FabPlus;