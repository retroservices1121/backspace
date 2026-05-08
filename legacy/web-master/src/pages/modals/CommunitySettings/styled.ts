// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Tab as ReactTab } from 'react-tabs';
import styled, { css } from 'styled-components';

import { IconButton } from 'styles/Buttons';
import { Row } from 'styles/Flex';

// export const TabList = styled(ReactTabList)`
//   width: 20%;
//   /* Adjust this min value depending on the shortest text in the menu */
//   min-width: 160px;
//   margin-right: 40px;
// `;

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

export const RejectionContainer = styled.div`
  text-align: center;
  margin: 20px 0px;
  padding: 20px 10px;
  border: 1px solid ${({ theme }) => theme.backgroundLight};
  border-radius: .6em;
`;

export const CenterText = styled.p`
  text-align: center;
`;

export const SelectContainer = styled.div`
  width: 50%;
  position: relative;
  top: -0.6em;
`;

export const MemberContainer = styled.div`
  background: ${({ theme }) => theme.backgroundMedium};
  margin-top: 1em;
  border-radius: .4em;
  height: 100%;
`;

export const SideTitle = styled.h3`
  margin-bottom: 10px;
`;

type TabProps = { active: boolean };

export const Tab = styled(ReactTab)<TabProps>`
  padding: 10px;
  list-style-type: none;
  color: ${({ theme }) => theme.fontPrimary};
  background: transparent;
  border-radius: .6em;
  user-select: none;
  cursor: pointer;

  ${({ active, theme }) => active && css`
    background: ${theme.primary};
    font-weight: bold;
  `};
`;

export const ChannelOrderItem = styled(Row)`
  align-items: center;
  margin: 10px;
  font-size: 16px;
  line-height: 100%;
`;

export const ChannelOrderButton = styled(IconButton).attrs(() => ({
  color: 'none',
}))`
  width: 30px;
  height: 30px;
  margin: 0px 3px;
`;
