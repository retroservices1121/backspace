// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import ReactLoading from 'react-loading';
import { useTheme } from 'styled-components';

import { configIcon } from 'icons';

import Logo from '../../../public/graphics/branding/backspace_with_logo.svg';
import { Container, Notice } from './styled';

type Props = {
  loading?: boolean;
  text?: string;
};

const Loading:React.FC<Props> = ({ text = '' }) => {
  const theme = useTheme();
  //Commented out max loading timer
  // const maxLoadingSeconds = 15;
  // const [timer, setTimer] = useState<number>();

  // //If loading goes too long
  // const LoadingTimer = () => {
  //   toast.error('Exceed Max Load Time.\n Please Try Again.');
  //   console.log('Exceed Max Load Time.\n Please Try Again.');
  // };

  // useEffect(() => {
  //   //Reset Timer on a state change of isOpen
  //   if (timer) {
  //     clearTimeout(timer);
  //   }
  //   //If isOpen, start a new timer
  //   if (loading) {
  //     const temp = window.setTimeout(LoadingTimer, maxLoadingSeconds * 1000);
  //     setTimer(temp);
  //   }
  // }, [loading]);

  return (
    <Container>
      <ReactLoading type="spinningBubbles" color={theme.fontFocus} />
      <Notice>{configIcon(Logo, { width: '200', height: '65', color: 'primary' })}</Notice>
      <Notice>{text}</Notice>
    </Container>
  );
};

export default Loading;
