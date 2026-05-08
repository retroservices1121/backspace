// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Styling

import styled from 'styled-components';

import { OldCol, OldRow } from 'styles/Flex';
import { Icon } from 'styles/Globals';
import Zindex from 'styles/zindex';

export const Container = styled(OldRow)`
  position: relative;
  width: 250px;
  max-width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.backgroundMedium};
  border-radius: 8px;
  margin: auto;
  align-items: center;
  /* &:focus-within {
    width: 100%;
  } */
`;

export const SearchInputIcon = styled.div`
  /* cursor: pointer; */
  position: absolute;
  opacity: 0.8;
  left: 15px;
  ${Container}:focus-within & {
    /* cursor: auto; */
    opacity: 1;

  }
`;

export const SearchInput = styled.input`
  width: inherit;
  background: transparent;
  border-style: solid; //remove inset
  border: 0px;
  font-size: 14px;
  color: ${({ theme }) => theme.fontTertiary};
  padding-left: 50px;
  &:focus {

    color: ${({ theme }) => theme.fontPrimary};
    outline-color: ${({ theme }) => theme.primary};
  }
`;

export const Matches = styled(OldCol)`
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
