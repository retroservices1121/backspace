// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled from 'styled-components';

import { Flex } from 'styles/Flex';

export const Container = styled(Flex)`
  position: absolute;
  top: 50%;
  left: 10%;
  background-color: ${({ theme }) => theme.backgroundNormal};

  &, img {
    height: 10em;
    width: 10em;
    border-radius: 50%;
    border: 1px solid ${({ theme }) => theme.backgroundLight};
    object-fit: cover;
  }
`;

export const PlusButton = styled.div`
  position: absolute;
  left: 6em;
  bottom: 1em;

  background-color: ${({ theme }) => theme.primary};
  border-radius: 100%;
  height: 24px;
  width: 24px;
  svg {
    margin-top: 2px;
    margin-left: 3px;

    fill: white;
    scale: .70;
  }
  &:hover {
    cursor: pointer;
    filter: brightness(1.2);
  }
`;

