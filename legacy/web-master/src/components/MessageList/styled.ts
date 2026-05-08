// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Styling

import styled, { css } from 'styled-components';

import { mediaQuery } from 'styles/Globals';

type ListProps = {
  height?: number;
  reverse?: boolean;
  center?: boolean;
  grid?: boolean;
};

export const List = styled.div<ListProps>`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: start;
  padding: 0px 30px;
  ${mediaQuery.sm} {
    padding: 0px 0px;
  }
  ${({ reverse }) => reverse && css`
    flex-direction: column-reverse;
    justify-content: end;
  `}
  ${({ grid }) => grid && css`
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: start;
  `}
  ${({ center }) => center && css`
    align-items: center;
  `}
  width: 100%;
  height: ${({ height }) => height || 'fit-content'};
`;


export const EndOfMessages = styled.h5` 
  white-space: nowrap;
  width: max-content;
  color: ${({ theme }) => theme.primary};
  ${mediaQuery.sm} {
    width: 60%;
  }
`;

export const LoadMoreNotice = styled.div`
  text-align: center;
  width: 100%;
  height: 100%;
`;
