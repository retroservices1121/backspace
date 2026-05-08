// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled, { css } from 'styled-components';
import tw from 'twin.macro';

import { NavLink } from 'lib/routing';
import { IconButton } from 'styles/Buttons';
import constants, { mediaQuery } from 'styles/Globals';
import Zindex from 'styles/zindex';

export const MobileNav = styled.div`
  background-color: ${({ theme }) => theme.backgroundNormal};
  border-bottom: 2px solid ${({ theme }) => theme.backgroundLight};
  z-index: ${Zindex.NavigationBar};
	${tw`sm:hidden py-3 flex justify-between items-center`}
`;

export const HideOnMobile = styled.div`
  ${tw`hidden sm:flex items-center`}
`;

export const HideOnDesktop = styled.div`
  ${tw`flex sm:hidden items-center`}
`;

export const NavContainer = styled.div`
  background-color: ${({ theme }) => theme.backgroundNormal};
  border-bottom: 2px solid ${({ theme }) => theme.backgroundLight};
  border-top: 2px solid ${({ theme }) => theme.backgroundLight};
  z-index: ${Zindex.NavigationBar};
  border: 1px solid ${({ theme }) => theme.dividerColor};
  ${tw`sm:border-t-0 flex justify-center w-screen`}
`;

// TODO: Make This Into A Global Icon
export const MenuIcon = styled.div`
  background: ${({ theme }) => theme.backgroundLight};
	${tw`mx-2 py-2 px-3 flex items-center cursor-pointer rounded-xl`}
`;

export const NavTitle = styled.div`
  cursor: pointer;
  height: 100%;
  max-height: 25px;
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

 &:hover {
   color: ${({ theme }) => theme.primary};
 }
`;

