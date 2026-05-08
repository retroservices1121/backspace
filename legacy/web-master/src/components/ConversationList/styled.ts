// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Styling
import styled, { css } from 'styled-components';

import { Row } from 'styles/Flex';
import constants from 'styles/Globals';

type Props = {
  active?: boolean;
};

export const Block = styled.div<Props>`

  cursor: pointer;

  height: 68px;
  width: calc(100% - ${constants.DRAWER_TAB});
  padding: 10px;
  margin-right: ${constants.DRAWER_TAB};
  text-align: left;
  align-items: center;

  /* If Active */
  ${({ active, theme }) => active && css`
    background-color: ${theme.primary};
  `}

  &:hover {
    background-color: var(--backgroundLight);
  }
`;

export const Title = styled.span`
  width: 100%;
  min-width: fit-content;
  font-weight: bold;
  font-size: 16px;
  line-height: 24px;
  color: ${({ theme }) => theme.fontFocus};
  text-align: left;

  ${Block}:hover & {
    color: ${({ theme }) => theme.primary};
  }
`;

export const Time = styled.span<Props>`
  width: 100%;
  font-size: 12px;
  line-height: 24px; //Must match title
  color: ${({ theme }) => theme.fontTertiary};
  margin-left: auto;
  margin-right: 0px;
  text-align: right;

  /* If Active */
  ${({ active, theme }) => active && css`
    color: ${theme.fontPrimary};
  `}

  ${Block}:hover & {
    color: ${({ theme }) => theme.primary};
  }
`;

export const Description = styled.span<Props>`
  width: 100%;
  overflow-wrap: break-word;
  font-size: 14px;
  line-height: 24px;
  color: ${({ theme }) => theme.fontTertiary};

  ${Block}:hover & {
    color: ${({ theme }) => theme.primary};
  }

   /* If Active */
   ${({ active, theme }) => active && css`
    color: ${theme.fontPrimary};
  `}

`;

export const UnreadCount = styled(Row)`
  justify-content: center;
  align-items: center;
  width: 25px;
  min-width: 25px;
  height: 25px;
  min-height: 25px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.fontPrimary};
`;

