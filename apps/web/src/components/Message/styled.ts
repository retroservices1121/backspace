// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Styling

import styled, { css } from 'styled-components';

import { IconButton } from 'styles/Buttons';
import { OldRow } from 'styles/Flex';

type Props = {
  isSelf?: boolean;
};

type MediaProps = {
  exists?: boolean;
  bigger?: boolean;
};

export const DeleteButton = styled.div`
  color: red;
  display: none;
  text-align: right;
`;

export const ActionButton = styled(IconButton)`
  background-color: ${({ theme }) => theme.backgroundLight};
  border-radius: 20%;
  margin: 0px 4px;
  width: 40px;
  height: 40px;
`;


export const Block = styled(OldRow)`
  &:hover {
    background-color: ${({ theme }) => theme.backgroundMedium};
  }
  &:hover ${DeleteButton} {
    display: inline;
  }
`;


export const Content = styled.div`
  width: 100%;
  height: 100%;
`;


export const Title = styled.div<Props>`
  cursor: pointer;

  font-weight: bold;
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.fontPrimary};
  margin-bottom: 10px;  
 
  /* If Self, Change color */
  ${({ isSelf, theme }) => isSelf && css`
    color: ${theme.primary};
  `}
`;

export const Time = styled.span`
  padding-left: 20px;
  opacity: 0.3;
  font-size: 12px;
  line-height: 20px;
`;


export const Text = styled.div`
  font-weight: normal;
  font-size: 16px;
  line-height: 20px;
  overflow-wrap: anywhere;
  color: ${({ theme }) => theme.fontPrimary};
  white-space: pre-line;
`;


export const MessageMedia = styled.img<MediaProps>`
  padding: 5px;
  border-radius: 20px;
  height: 120px;
  width: auto;
  max-height: 100%;
  max-width: 100%;
  object-fit: cover;

  //On click, make it bigger
  ${({ bigger }) => bigger && css`
    height: 480px;
  `}
`;


