// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Styling
import styled, { css } from 'styled-components';

import { Row } from 'styles/Flex';



type TitleProps = {
  active?: boolean;
};



export const ListItem = styled.div<TitleProps>`
  cursor:pointer;

  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  padding: 10px 15px;
  margin: 2px auto;

  border-radius: 15px;
  width: 100%;
  min-width: 100px;

  color: ${({ theme }) => theme.fontFocus};
  font-weight: normal;
  font-size: 16px;
  line-height: 20px;

  opacity: 0.5;

  /* If Active */
  ${({ active, theme }) => active && css`
    background-color: ${theme.backgroundLight};
    color: ${theme.fontFocus};
    opacity: 1.0;
  `}
  /* If active, don't show the hover effect */
  /* This is mainly so the threeDots icon shows its own hover effect */
  ${({ active }) => !active && css`
    &:hover {
      background-color: ${({ theme }) => theme.primary};
      opacity: 1.0;
    }
  `}
`;

export const Title  = styled.span `
  margin: 0px 10px;
`;

export const UnreadCount = styled(Row)`
  justify-content: center;
  align-items: center;
  width: fit-content;
  padding: 0px 5px;
  min-width: 20px;
  height: 20px;
  min-height: 20px;
  border-radius: 10px;
  background-color: red;
  color: ${({ theme }) => theme.fontPrimary};

  font-size: 14px;
`;

export const Hint = styled.p`
  color: ${({ theme }) => theme.primary};
  margin: 0px;
  padding: 0px;
  line-height: 24px;
  font-size: 12px;
`;

