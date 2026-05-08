// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { NavLink } from 'lib/routing';
import { IconButton } from 'styles/Buttons';
import { Row } from 'styles/Flex';
import constants, { mediaQuery } from 'styles/Globals';
import Zindex from 'styles/zindex';

export const MobileNav = styled.div`
  background-color: ${({ theme }) => theme.backgroundMedium};
  border-bottom: 2px solid ${({ theme }) => theme.backgroundLight};
	${tw`sm:hidden py-3 flex justify-between items-center`}
`;

export const HideOnMobile = styled.div`
  ${tw`hidden sm:block`}
`;

export const NavContainer = styled(Row)`
  position: relative;
  justify-content: space-between;
  width: 100%;
  height: ${constants.NAVIGATION_HEIGHT};

  background-color: ${({ theme }) => theme.backgroundMedium};

  @media screen and (max-width: ${constants.SMALLSCREEN_WIDTH}) {
    position: fixed;
    justify-content: center;
    align-items: center;
    left: 0px;
    bottom: 0px;
    border-top: 1px solid ${({ theme }) => theme.backgroundLight};
  }

  @media screen and (min-width: ${constants.MEDIUMSCREEN_WIDTH}) {
    border-bottom: 2px solid ${({ theme }) => theme.backgroundLight};
    left: 0px;
    top: 0px;
  }

  z-index: ${Zindex.NavigationBar};
`;

export const NavTitle = styled.div`
  cursor: pointer;
  height: 100%;
  max-height: 30px;
  fill: ${({ theme }) => theme.fontFocus};
  margin: auto auto auto 0px;

  &:hover {
    filter: brightness(1.5);
  }

  @media screen and (max-width: ${constants.SMALLSCREEN_WIDTH}) {
    display: none;
  }
  @media screen and (min-width: ${constants.SMALLSCREEN_WIDTH}) {
    display: block;
  }
`;

export const HomeButton = styled(NavLink)`
  //Renders only on mobile
  display: none;
  ${mediaQuery.sm}{
    display: block;
  }
`;

export const NavButton = styled(IconButton)`
  position: relative; //so I can put things in the corner
  width: 44px;
  height: 44px;
  margin: auto 5px;
  /* background: rgba(${({ theme }) => theme.primary_rgb}, 0.5) !important; */

  /* Override IconButton */
  //@ts-ignore
  ${({ selected, selectedColor, theme }) => selected && selectedColor && css`
    border: 1px ridge ${theme[selectedColor]};
    background: rgba(${theme.primary_rgb}, 0.2) !important;
  `};
`;

export const Avatar = styled.img`
  width: 100%;
  height: 100%;
  margin: 3px;
  object-fit: cover;
  border-radius: inherit;
`;

export const NotificationIndicator = styled.div`
  position: absolute;
  top: -2px;
  right: -2px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.backgroundMedium};
  background-color: ${({ theme }) => theme.error};
`;

export const EnvTypeText = styled.h2`
 cursor: pointer;
 color: ${({ theme }) => theme.error};
 margin: auto auto auto 0px;

 &:hover {
   color: ${({ theme }) => theme.primary};
 }
`;
