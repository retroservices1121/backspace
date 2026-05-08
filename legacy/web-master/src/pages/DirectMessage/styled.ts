// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled from 'styled-components';

import { Col, Row } from 'styles/Flex';

export const Container = styled(Row)`
  justify-content: flex-start;
  height: 100%;
  width: 100%;
  max-height: 100%;
  max-width: 100vw; 
  background-color: ${({ theme }) => theme.backgroundNormal}
`;

export const DrawerHeader = styled(Col)`
  width: 100%;
  justify-content: space-between;
  align-items: center;
  padding: 10px 40px;
`;
