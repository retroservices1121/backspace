// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled from 'styled-components';

import { Col } from 'styles/Flex';

export const Container = styled(Col)`
  justify-content: center;
  align-content: center;
  text-align: center;
  padding: 30px;
  width: 100%;
  max-width: 500px;
  height: 100%;
  margin: auto;
  overflow-y: auto;

  * {
    text-align: center;
  }
`;

export const BiggerFont = styled.span`
  * {
    font-size: 26px;
    line-height: 32px;
  }
`;

