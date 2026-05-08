// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Styling
import styled, { css } from 'styled-components';

import activeMarker from 'graphics/commonicons/activemarker.svg';
import { Row } from 'styles/Flex';
import Zindex from 'styles/zindex';

type ButtonProps = {
  active?: boolean;
  size?: string;
};

export const ImageInButton = styled.img`
  object-fit: cover;
  width: 100%;
  height: 100%;
  border-radius: inherit;
`;

export const ImageButton = styled.div<ButtonProps>`
  cursor:pointer;

  position: relative;

  font-size: 24px;
  line-height: 100%;

  background-color: ${({ theme }) => theme.backgroundNormal};
  border: 2px solid ${({ theme }) => theme.backgroundLight};

  width: ${({ size }) => size || '48px'};
  height: ${({ size }) => size || '48px'};
  min-width: ${({ size }) => size || '48px'};
  min-height: ${({ size }) => size || '48px'};
  border-radius: 8px;

  margin: 5px auto;
  padding: auto;

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;


  /* If Active */
  ${({ active, theme }) => active && css`
    border: 2px solid ${theme.fontFocus};
    &::before {
      position: absolute;
      left: -25px;
      content: url(${activeMarker});
      height: 24px;
      top: 20%;
    }
  `}



  &:hover {
    border: 2px solid ${({ theme }) => theme.primary};
    cursor: pointer;
  }
`;

export const TooltipText = styled.div`
  visibility: hidden;

  position: absolute;
  left: 110%;
  z-index: ${Zindex.ToolTip};
  display: flex;
  align-items: center;
  justify-content: center;


  width: fit-content;
  min-width: 150px;
  height: fit-content;
  min-height: 40px;

  color: ${({ theme }) => theme.white};
  font-size: 16px;
  line-height: 40px;
  padding: 2px;

  background-color: ${({ theme }) => theme.primary};
  border-radius: 6px;
  text-align: center;

  ${ImageButton}:hover & {
    visibility: visible;
  }


  &:after {
    content: "";
    position: absolute;
    top: 50%;
    right: 100%;
    margin-top: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: transparent ${({ theme }) => theme.primary} transparent transparent;
  }
`;

export const UnreadCount = styled(Row)`
  position: absolute;
  top: -5px;
  right: -5px;
  justify-content: center;
  align-items: center;

  padding: 0px 7%;
  width: fit-content;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  background-color: ${({ theme }) => theme.error};
  color: ${({ theme }) => theme.white};

  border: 2px solid ${({ theme }) => theme.backgroundLight};
  font-size: 12px;
  line-height: 24px;
`;
