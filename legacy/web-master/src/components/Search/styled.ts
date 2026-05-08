// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Styling

import styled from 'styled-components';
import tw from 'twin.macro';

import { Col, Row } from 'styles/Flex';
import { Icon } from 'styles/Globals';
import Zindex from 'styles/zindex';

export const Container = styled(Row)`
  position: relative;
  width: 100%;
  max-width: 300px;
  height: 100%;
  background: ${({ theme }) => theme.backgroundMedium};
  border-radius: 8px;
  margin: auto;
  align-items: center;

`;

export const SearchInputIcon = styled(Icon)`
  position: absolute;
  left: 15px;
  opacity: 0.5;
  ${Container}:focus-within & {
    opacity: 1;
  }
`;

export const SearchInput = styled.input`
  ${tw`leading-[35px] sm:leading-[44px]`}

  width: inherit;
  background: transparent;

  border-style: solid; //remove inset
  border: 0px;
  padding-left: 50px;
  font-size: 14px;

  color: ${({ theme }) => theme.fontTertiary};

  &:focus {
    color: ${({ theme }) => theme.fontPrimary};
    outline-color: ${({ theme }) => theme.primary};
  }
`;

export const Matches = styled(Col)`
  visibility: hidden;
  transition: visibility 0s linear 250ms, opacity 250ms; // Allows clicking before defocusing

  position: absolute;
  top: 110%;
  right: 0;
  z-index: ${Zindex.Search};

  width: 100%;
  height: fit-content;
  max-height: 50vh;
  padding: 10px;

  background: ${({ theme }) => theme.backgroundMedium};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.backgroundLight};

  font-size: 14px;
  line-height: 44px;
  color: ${({ theme }) => theme.fontTertiary};

  overflow-y: auto;

  ${Container}:focus-within & {
    visibility: visible;
  }
`;
