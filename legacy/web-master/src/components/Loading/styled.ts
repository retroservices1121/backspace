// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Styling

import styled from 'styled-components';

import { Col } from 'styles/Flex';

export const Container = styled(Col)`
  position: absolute;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 10px 10px;
`;


export const Notice = styled.h3`
  margin: 20px auto;
`;