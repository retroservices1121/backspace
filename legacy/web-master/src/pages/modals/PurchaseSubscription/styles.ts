// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled from 'styled-components';

import { mediaQuery } from 'styles/Globals';

export const Container = styled.div`
  padding: 30px 20px;
  min-width: 600px;
  ${mediaQuery.sm} {
    min-width: 300px;
  }
  
  width: fit-content;
  max-width: 100%;
  height: fit-content;
  max-height: 100%;
  overflow: auto;
`;

export const BorderBox = styled.div`
  border: 2px solid ${({ theme }) => theme.backgroundLight};
  padding: 20px;
  border-radius: .8em;
`;

export const TertiarySpan = styled.span`
  color: ${({ theme }) => theme.fontTertiary};
`;