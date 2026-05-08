// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Styling

import styled, { css } from 'styled-components';

import { IconButton } from 'styles/Buttons';
import { Col } from 'styles/Flex';

type Props = {
  selected?: boolean
};

export const CloseContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 5px;
`;

export const ActionButton = styled(IconButton)`
  background-color: ${({ theme }) => theme.backgroundLight};
  border-radius: 20%;
  margin: 0px 4px;
  width: 40px;
  height: 40px;
`;


export const Container = styled(Col)`
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 20px;
  margin-top: 60px;

  h3 {
    margin: 20px 0px 5px 0px;
  }
`;

export const Block = styled(Col)`
  width: 100%;
  height: fit-content;
  text-align: left;
  padding: 20px;
`;

export const ChannelOption = styled.div<Props>`
  cursor: pointer;
  justify-content: space-around;

  height: 100px;

  margin: 10px auto 10px auto;
  padding: 15px 20px;
  border: 1px solid ${({ theme }) => theme.backgroundLight};
  border-radius: 12px;

  line-height: 24px;

  &:hover {
    border: 1px solid ${({ theme }) => theme.secondary};
  }

  ${({ selected, theme }) => selected && css`
    border: 1px solid ${theme.primary};
  `}
`;

export const PermissionContainer = styled.div<Props>`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
`;

export const AccessOption = styled.div<Props>`
  cursor: pointer;
  justify-content: center;
  align-items: center;

  width: fit-content;
  min-width: 100px;
  height: fit-content;
  min-height: 40px;
  margin: 0px 20px 0px 20px;
  border: 2px dotted ${({ theme }) => theme.backgroundLight};
  border-radius: 8px;
  
  background: transparent;
  text-align: center;
  line-height: 40px;
  color: ${({ theme }) => theme.fontSecondary};

  ${({ selected, theme }) => selected && css`
    border: 2px outset ${theme.iconColor};
    background: ${theme.primary};
    filter: brightness(1.08);
    color: ${theme.fontPrimary};
  `}
`;
