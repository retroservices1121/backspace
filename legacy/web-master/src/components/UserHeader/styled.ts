// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Styling

import styled, { css } from 'styled-components';

import { Icon } from 'styles/Globals';

export const Container = styled.div<{ onClick?: Function }>`
  border-radius: 8px;
  min-width: 200px;
  width: fit-content;
  max-width: 100%;
  height: fit-content;
  padding: 5px;
  ${({ onClick }) => onClick !== undefined && css`
    cursor: pointer;
    &:hover {
      background-color: ${({ theme }) => theme.backgroundLight};
    }
  `}
`;

export const Username = styled.h6`
  color: ${({ theme }) => theme.fontTertiary};
`;
export const DisplayName = styled.h4`
  color: ${({ theme }) => theme.fontPrimary};
`;

export const VerificationIcon = styled(Icon)`
  margin-left: 5px;
  height: 18px;
  width: 18px;
`;
