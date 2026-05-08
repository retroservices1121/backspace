// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled from 'styled-components';

import { Flex } from 'styles/Flex';

export const Container = styled(Flex)`
  &, img {
    height: 8em;
    width: 8em;
    border-radius: 100%;
  }

  border: .2em dashed ${({ theme }) => theme.backgroundLight};
  margin: 1.5em auto;

  // For positioning the plus button
  position: relative;
`;

export const PlusButton = styled.div`
  position: absolute;
  left: 6em;
  top: 5.5em;

  background-color: ${({ theme }) => theme.primary};
  border-radius: 100%;
  height: 24px;
  width: 24px;
  svg {
    fill: white;
    scale: .70;
  }
  &:hover {
    cursor: pointer;
    filter: brightness(1.2);
  }
`;

