// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

/*eslint-disable*/
import styled, { css } from 'styled-components';
import tw from 'twin.macro';

export const Clock = styled.div`
  border-color: ${({ theme }) => theme.fontPrimary};
	${tw`relative flex items-center justify-end w-8 h-8 overflow-hidden border-[2px] rounded-full `}
`;

export const MinuteHand = styled.div<{ position?: number }>`
  background: ${({ theme }) => theme.fontPrimary};
  ${tw`absolute w-1/2 h-1 rounded-full origin-left duration-1000 ease-in-out`}
  ${({ position }) => position && css`
    transform: rotate(${position}deg)
  `}
`;

export const HourHand = styled.div<{ position?: number }>`
  ${tw`absolute w-1/2 h-1 origin-left duration-1000 ease-in-out`}
  ${({ position }) => position && css`
    transform: rotate(${position}deg)
  `}
`;
