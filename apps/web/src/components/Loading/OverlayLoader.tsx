// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import ReactLoading from 'react-loading';
import { useTheme } from 'styled-components';

import { configIcon } from 'icons';

import Logo from '../../../public/graphics/branding/backspace_with_logo.svg';
import { Notice } from './styled';

type Props = {
  loading?: boolean;
  text?: string;
};

const OverlayLoading:React.FC<Props> = ({ text = '' }) => {
  const theme = useTheme();

  return (
    <div 
      className='flex flex-col justify-center align-center 
      z-50 absolute w-full h-full bg-opacity-90 bg-backgroundMedium'
    >
      <ReactLoading width='70px' height='70px' className='mx-auto' type="spinningBubbles" color={theme.fontFocus} />
      <Notice>{text}</Notice>
      <Notice>{configIcon(Logo, { width: '200', height: '65', color: 'primary' })}</Notice>
    </div>
  );
};

export default OverlayLoading;
