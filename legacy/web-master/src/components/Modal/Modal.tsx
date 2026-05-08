// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import ReactModal from 'react-modal';
import { useTheme } from 'styled-components';

import Zindex from 'styles/zindex';

export const MODAL_ROOT = 'modal-root';

// These styles make the modal size itself based on the inner children
export const simplifiedModalStyles = {
  overlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    top: 'initial',
    left: 'initial',
    right: 'initial',
    bottom: 'initial',
  },
};

const Modal: React.FC<ReactModal.Props> = ({
  children, ...props
}) => {
  const theme = useTheme();
  return (
    <ReactModal
      {...props}
      parentSelector={() => document.getElementById(MODAL_ROOT) as HTMLElement}
      style={{
        overlay: {
          zIndex: Zindex.Modal,
          backgroundColor: 'rgba(15, 15, 15, 0.65)',
          ...props.style?.overlay,
        },
        content: {
          backgroundColor: theme.backgroundNormal,
          border: `1px solid ${theme.backgroundLight}`,
          borderRadius: '8px',
          padding: 0,
          margin: 'auto',
          left: 0,
          right: 0,
          maxWidth: '95vw',
          maxHeight: '95vh',
          ...props.style?.content,
        },
      }}
    >
      {children}
    </ReactModal>
  );
};
export default Modal;
