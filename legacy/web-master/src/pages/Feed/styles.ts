// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { ButtonSmall, SmallTextButton } from 'styles/Buttons';
import { Row } from 'styles/Flex';
import { disableScrollbar, mediaQuery } from 'styles/Globals';


export const Container = styled(Row)`
  justify-content: center;
  width: 100%;
  margin: auto;
  height: 100%;
  overflow-y: auto;
  /* ${disableScrollbar}; */
  ${mediaQuery.sm} {
    justify-content: start;
    width: fit-content;
  };
`;

export const FeedContainer = styled.div`
  width: fit-content;
  // min width prevents flex container sizing down during loading.
  min-width: 660px; //Matches MediaPost width + margin
  max-width: 100vw;
  height: fit-content;
  /* & > div { scrollbar-width: none; } */
  ${mediaQuery.sm} {
    width: 100%;
    min-width: 200px;
    max-width: 100vw;
  }
`;

export const Card = styled.div`
  width: 90%;
  background-color: ${({ theme }) => theme.backgroundNormal};
  border-radius: 20px;
  margin: 10px 0px;
  padding: 30px;
`;

export const CardTitle = styled.h3`
  font-weight: bold;
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.fontFocus};
  margin-bottom: 10px;
`;

export const ControlCard = styled.div`
  background-color: ${({ theme }) => theme.backgroundMedium};
  ${tw`rounded-3xl my-6 sm:my-10 py-8 sm:py-10 px-4 sm:px-12`}
  border: 1px solid ${({ theme }) => theme.dividerColor};
`;

export const FeedOptions = styled(Row)`
  justify-content: center;
  width: 100%;
  max-width: 800px;
  height: 100%;
  max-height: 50vh;
  overflow-y: auto;
`;

export const FeedButton = styled(SmallTextButton)`
  margin-top: 5px;
  border-color: transparent;
  justify-content: flex-start;
  font-size: 18px;
  line-height: 22px;
  ${({ selected }) => !selected && css`
    opacity: 0.5;
  `}
`;

export const InterestButton = styled(ButtonSmall)`
  ${tw`m-2 p-3 sm:p-4`}
  font-size: 16px;
  line-height: 1;
  ${({ selected }) => !selected && css`
    opacity: 0.5;
  `}
  border: 1px outset ${({ theme }) => theme.primary};
`;

export const OptionTitle = styled.h4`
  margin-bottom: 5px;
  font-weight: bold;
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.fontFocus};
  text-align: left;
`;
