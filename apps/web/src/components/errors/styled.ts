// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled from 'styled-components';

import { Flex } from 'styles/Flex';
import constants from 'styles/Globals';

export const CenterPage = styled(Flex)`
  height: calc(100% - ${constants.NAVIGATION_HEIGHT});
`;

export const ErrorHeader = styled.h1`
  color: ${({ theme }) => theme.error};
`;

const opacity = (num: number) => num.toString(16);

export const ErrorMessage = styled.h6`
  background: ${({ theme }) => theme.error + opacity(30)};
  padding: 1em;
  border-radius: .4em;
`;
