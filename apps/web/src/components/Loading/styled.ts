// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Styling

import styled from 'styled-components';

import { OldCol } from 'styles/Flex';

export const Container = styled(OldCol)`
  position: absolute;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  padding: 10px 10px;
`;


export const Notice = styled.h3`
  margin: 20px auto;
`;