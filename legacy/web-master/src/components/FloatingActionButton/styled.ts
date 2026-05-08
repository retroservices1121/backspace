// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Styling

import styled from 'styled-components';
import tw from 'twin.macro';

import { Row } from 'styles/Flex';
import Zindex from 'styles/zindex';

export const Container = styled(Row)`
  ${tw`hidden sm:flex`}
  position: absolute;
  cursor: pointer;
  bottom: 70px;
  right: 50px;
  justify-content: center;
  align-items: center;

  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.primary};
  filter: drop-shadow(0 0 0.75rem ${({ theme }) => theme.backgroundDark});

  &:hover {
    filter: brightness(1.1);
  }
`;

// TODO possible duplicate in /home/metru/dev/backchannel-web/src/components/CommunityIcon/styled.ts
export const TooltipText = styled.div`
  visibility: hidden;

  position: absolute;
  right: 110%;
  z-index: ${Zindex.ToolTip};
  display: flex;
  align-items: center;
  justify-content: center;


  width: fit-content;
  min-width: 150px;
  height: fit-content;
  min-height: 40px;

  color: ${({ theme }) => theme.fontFocus};
  font-size: 16px;
  line-height: 40px;
  padding: 2px;

  background-color: ${({ theme }) => theme.primary};
  border-radius: 6px;
  text-align: center;

  ${Container}:hover & {
    visibility: visible;
  }
`;
