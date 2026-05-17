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
  color: var(--pink-2);
  display: none;
  text-align: right;
`;

export const ActionButton = styled(IconButton)`
  background-color: var(--surface);
  border: 1px solid var(--line);
  border-radius: 10px;
  margin: 0px 4px;
  width: 36px;
  height: 36px;
  color: var(--ink-2);
  transition: background-color 0.15s ease, color 0.15s ease;
  &:hover {
    background-color: var(--hover);
    color: var(--ink);
  }
`;


export const Block = styled(OldRow)`
  transition: background-color 0.15s ease;
  &:hover {
    background-color: var(--hover);
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

  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: var(--ink);
  margin-bottom: 6px;

  /* If Self, tint to brand-2 so own messages stand out */
  ${({ isSelf }) => isSelf && css`
    color: var(--brand-2);
  `}
`;

export const Time = styled.span`
  padding-left: 12px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--ink-3);
  font-size: 11px;
  line-height: 20px;
`;


export const Text = styled.div`
  font-weight: 400;
  font-size: 15px;
  line-height: 22px;
  overflow-wrap: anywhere;
  color: var(--ink);
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


