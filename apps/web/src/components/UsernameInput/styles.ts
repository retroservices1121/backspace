// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled, { css } from 'styled-components';

import { BaseInputCss, placeholderStyle } from 'components/FormInput/styles';

export const StylelessInput = styled.input`
  display: inline;
  border: none;
  background: transparent;
  &:focus {
    border: none;
    outline: none;
  }
`;

export const PlaceholderSpan = styled.span`
  ${placeholderStyle}
`;

type InputDivProps = {
  showBorder: boolean;
};

export const InputDiv = styled.div<InputDivProps>`
  ${BaseInputCss}
  display: flex;
  ${({ showBorder, theme }) => showBorder && css`
    border: 1px solid ${theme.primary};
    outline: 2px solid ${theme.primary};
  `}
`;