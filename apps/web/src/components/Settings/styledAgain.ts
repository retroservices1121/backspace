// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled from 'styled-components';

import { OldCol } from 'styles/Flex';
import constants, { mediaQuery } from 'styles/Globals';

export const Container = styled(OldCol)`
  height: 100%;
  width: 100%;
  max-width: 800px;
  padding: 20px 40px;
  text-align: left;
  overflow-y: auto;
  overflow-x: hidden; //TODO Weird 5px overflow??
  ${mediaQuery.sm} {
    max-height: calc(102vh - ${constants.NAVIGATION_HEIGHT});
  }
`;

export const Card = styled.div`
  width: 90%;
  background-color: ${({ theme }) => theme.backgroundMedium};
  border-radius: 20px;
  margin: 20px 0px;
  padding: 10px 0px;
`;

export const ImageHeader = styled.div`
  position: relative;
`;

export const Footer = styled(OldCol)`
  width: 100%;
  margin: auto 0px 0px 0px;
`;

export const PaymentMethodInput = styled(OldCol)`
  justify-content: space-evenly;
  align-items: center;
  width: 400px;
  max-width: 90vw;
`;
