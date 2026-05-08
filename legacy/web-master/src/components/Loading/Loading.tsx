// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect, useState } from 'react';
import ReactLoading from 'react-loading';
import ReactModal from 'react-modal';
import { toast } from 'react-toastify';
import { useTheme } from 'styled-components';

import { Container, Notice } from './styled';

export const LoadingRaw: React.FC<{ text?: string }> = ({
  text = '',
}) => {
  const theme = useTheme();
  return (
    <Container>
      <ReactLoading type="spinningBubbles" color={theme.fontFocus} />
      <Notice>{text}</Notice>
    </Container>
  );
};

type Props = {
  onRequestClose: () => void;
  isOpen: boolean;
  text?: string;
};

const Loading:React.FC<Props> = ({ onRequestClose, isOpen, text = 'Loading' }) => {
  const theme = useTheme();
  const maxLoadingSeconds = 15;
  const [timer, setTimer] = useState<number>();

  //If loading goes too long
  const LoadingTimer = () => {
    toast.error('Exceed Max Load Time.\n Please Try Again.');
    console.log('Exceed Max Load Time.\n Please Try Again.');
    onRequestClose();
  };

  useEffect(() => {
    //Reset Timer on a state change of isOpen
    if (timer) {
      clearTimeout(timer);
    }
    //If isOpen, start a new timer
    if (isOpen) {
      const temp = window.setTimeout(LoadingTimer, maxLoadingSeconds * 1000);
      setTimer(temp);
    }
  }, [isOpen]);

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={() => onRequestClose()}
      style={{
        overlay: {
          zIndex: Number.MAX_SAFE_INTEGER,
          backgroundColor: 'rgba(15, 15, 15, 0.65)',
        },
        content: {
          background: 'none',
          border: 'none',
          borderRadius: '8px',
          padding: 0,
          margin: 'auto',
        },
      }}
    >
      <Container>
        <ReactLoading type="spinningBubbles" color={theme.fontFocus} />
        <Notice>{text}</Notice>
      </Container>
    </ReactModal>
  );
};

export default Loading;
