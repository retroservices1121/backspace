// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled, { css } from 'styled-components';

import { ButtonCss, Props } from 'styles/Buttons';

export const ActionTileButton = styled.button.attrs(props => ({
  // to prevent all button from accidentally being a form submit
  type: props.type || 'button',
}))<Props>`
  ${ButtonCss}

  padding: 10px 20px;
  width: 90px;
  font-size: 12px;
  line-height: 18px;
  border-radius: 8px;

  ${({ theme, disabled }) => disabled && css`
    background-color: ${theme.backgroundLight};
    color: ${theme.fontTertiary};
  `}
`;
