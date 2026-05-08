// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Fragment } from 'react';
import { Tab as ReactTab, TabList as ReactTabList, Tabs } from 'react-tabs';
import { Tab as HTab } from '@headlessui/react';
import styled, { css } from 'styled-components';

import { IconButton } from 'styles/Buttons';
import { OldRow } from 'styles/Flex';

export const Container = styled(Tabs)`
  display: flex;
  width: 100%;
  height: 100%;
`;

export const TabList = styled(ReactTabList)`
  width: 20%;
  /* Adjust this min value depending on the shortest text in the menu */
  min-width: 160px;
  margin-right: 40px;
`;

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
  background: ${({ theme }) => theme.backgroundMedium};;
  padding: 0 1em;
  margin-top: 1em;
  border-radius: .4em;
  height: 100%;
`;

export const SideTitle = styled.h3`
  margin-bottom: 10px;
`;

export const Main = styled.main`
  width: 80%;
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

export const ChannelOrderItem = styled(OldRow)`
  align-items: center;
  margin: 10px;
  font-size: 16px;
  line-height: 100%;
`;

export const ChannelOrderButton = styled(IconButton)`
  width: 30px;
  height: 30px;
  margin: 0px 3px;
`;

export const TabButton: React.FC = ({ children }) => (
  <HTab as={Fragment}>
    {({ selected }) => (
      <button className={`btn btn-tab ${selected ? 'bg-primary' : ''}`}>
        {children}
      </button>
    )}
  </HTab>
);