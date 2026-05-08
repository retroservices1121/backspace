import styled from 'styled-components';

import { mediaQuery } from './Globals';

type HProps = {
  width?: string,
};

type VProps = {
  height?: string,
};

export const HorizontalLine = styled.div<HProps>`
  height: 1px;
  min-height: 1px;
  width: ${({ width }) => width || 'inherit'};
  background-color: ${({ theme }) => theme.backgroundLight};
  margin: 5px;
`;

export const VerticalLine = styled.div<VProps>`
  height: ${({ height }) => height || 'inherit'};
  width: 1px;
  min-width: 1px;
  background-color: ${({ theme }) => theme.backgroundLight};
  margin: 5px 0px;
`;


export const Separator = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  text-align: center;

  margin: 20px 0px;
  ${mediaQuery.sm} {
    margin: 10px 0px;
  }

  /* Text */
  font-size: 12px;
  line-height: 16px;
  /* width: 100%; */
  color: ${({ theme }) => theme.fontTertiary};;
  white-space: nowrap;

  /* Lines */
  ::before, ::after {
    content: '';
    background: ${({ theme }) => theme.backgroundLight};;
    width: 100%;
    height: 1px;
    margin: auto 0;
  }

  ::before {
    margin-right: 35px;
  }

  ::after {
    margin-left: 35px;
  }
`;