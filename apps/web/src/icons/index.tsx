/* eslint-disable @typescript-eslint/indent */
// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import styled, { css, DefaultTheme, StyledComponent } from 'styled-components';

import CheckIcon from 'icons/check.svg';
import ChatIcon from 'icons/comment.svg';
import CommunityIcon from 'icons/community.svg';
import DiscoverIcon from 'icons/discover.svg';
import MoreIcon from 'icons/dots-horizontal.svg';
import GridIcon from 'icons/grid.svg';
import HeartIcon from 'icons/heart.svg';
import HomeIcon from 'icons/home.svg';
import LeaveIcon from 'icons/leave.svg';
import LockIcon from 'icons/lock.svg';
import MenuIcon from 'icons/menu.svg';
import MessageIcon from 'icons/message-dots.svg';
import MoonIcon from 'icons/moon.svg';
import BellIcon from 'icons/notification/bell.svg';
import PortfolioIcon from 'icons/briefcase.svg';
import PlusIcon from 'icons/plus.svg';
import PlusBoxIcon from 'icons/plus-box.svg';
import PostIcon from 'icons/post.svg';
import RefreshIcon from 'icons/refresh.svg';
import SearchIcon from 'icons/search.svg';
import SendIcon from 'icons/send.svg';
import ShareIcon from 'icons/share-reply.svg';
import LiveIcon from 'icons/signal-live.svg';
import SunIcon from 'icons/sun.svg';
import VerifiedIcon from 'icons/verified.svg';
import VerifiedOrgIcon from 'icons/verified-org.svg';
import XIcon from 'icons/x.svg';

const baseSVG = styled.svg``;

export type IconOptions = React.SVGProps<SVGSVGElement> & {
  /** Set SVG width */
  width: string;
  /** Set SVG height */
  height: string;
  /** Set SVG margin */
  margin: string;
  /** Set SVG base color */
  color: keyof DefaultTheme;
  /** Set SVG active state */
  active: boolean;
  /** Set SVG active color */
  activeColor: keyof DefaultTheme;
  /** allowFill: Whether to allow svg to be filled in (often tie to active boolean) */
  allowFill: boolean; 
  /** Set SVG hover behavior */
  clickable: boolean;
  /** Set SVG hover color */
  hovercolor: keyof DefaultTheme;
  /** Set SVG size using defaults 'sm, md, lg' */
  size: 'sm' | 'md' | 'lg' | undefined;
};

const defaultIconOptions : IconOptions = {
  width: '24px',
  height: '24px',
  margin: '0px',
  strokeWidth: '0',
  color: 'fontFocus',
  active: false, 
  activeColor: 'primary',
  allowFill: true, //May need to edit SVGs to be fill="transparent"
  clickable: false,
  hovercolor: 'primary',
  size: undefined,
  className: '',
};

const StyledIcon = styled.svg<IconOptions>`
  width: ${({ width }) => width};
  height: ${({ height }) => height};
  margin: ${({ margin }) => margin};
  stroke-width: ${({ strokeWidth }) => strokeWidth}; 
  ${({ allowFill, color, theme }) => css`
    fill: ${allowFill ? theme[color] : theme.none};
    stroke: ${theme[color]};
  `}
  /** If Active */
  ${({ theme, active, activeColor, allowFill }) => active && css`
    fill: ${allowFill ? theme[activeColor] : theme.none};
    stroke: ${theme[activeColor]};
  `}
  ${({ theme, clickable, allowFill, hovercolor: hoverColor }) => clickable && css`
    cursor: pointer;
    &:hover {
      fill: ${allowFill ? theme[hoverColor] : theme.none};
      stroke: ${theme[hoverColor]};
    }
  `}
  ${({ size }) => {
    switch (size) {
      case 'sm':
        return css`
                width: 15px; 
                height: 15px;
              `;
      case 'md':
        return css`
                width: 24px; 
                height: 24px;
              `;
      case 'lg':
        return css`
                width: 40px; 
                height: 40px;
              `;  
      default:
        break;
    }
  }};
`;

export function configIcon(
  mySVG: React.FC<any> | StyledComponent<any, any, any, any>, 
  options: Partial<IconOptions> = defaultIconOptions,
) {
  const allowFill = options.allowFill != undefined ? options.allowFill : defaultIconOptions.allowFill ;
  const props = { ...defaultIconOptions, ...options, allowFill };
  
  return (
    <StyledIcon {...props} as={mySVG}/>
  );
}

// Fuck you react SVGs
/** @deprecated */
export function makeIcon(svgIcon: React.FC<any>, baseSvg: StyledComponent<any, any> = baseSVG) {
  return styled(baseSvg).attrs((props: any) => ({ as: svgIcon, ...props }))``;
}

class Icons {
  static Chat       = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(ChatIcon, option);
  static Close      = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(XIcon, option);
  static Check      = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(CheckIcon, option);
  static Community  = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(CommunityIcon, option);
  static Discover   = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(DiscoverIcon, option);
  static Grid       = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(GridIcon, option);
  static Heart      = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(HeartIcon, option);
  static Home       = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(HomeIcon, option);
  static Leave      = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(LeaveIcon, option);
  static Live       = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(LiveIcon, option);
  static Lock       = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(LockIcon, option);
  static Message    = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(MessageIcon, option);
  static Menu       = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(MenuIcon, option);
  static Moon       = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(MoonIcon, option);
  static More       = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(MoreIcon, option);
  static Bell       = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(BellIcon, option);
  static Plus       = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(PlusIcon, option);
  static PlusBox    = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(PlusBoxIcon, option);
  static Portfolio  = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(PortfolioIcon, option);
  static Post       = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(PostIcon, option);
  static Refresh    = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(RefreshIcon, option);
  static Send       = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(SendIcon, option);
  static Search     = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(SearchIcon, option);
  static Share      = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(ShareIcon, option);
  static Sun        = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(SunIcon, option);
  static Verified   = (option: Partial<IconOptions> = { ...defaultIconOptions, color: 'verified', size: 'sm' }) => configIcon(VerifiedIcon, option);
  // Org accounts: same brand-purple, hexagon shape instead of the
  // scalloped person badge.
  static OrgVerified = (option: Partial<IconOptions> = { ...defaultIconOptions, color: 'verified', size: 'sm' }) => configIcon(VerifiedOrgIcon, option);
  // Grid:         configIcon(GridIcon),
  // Live:         configIcon(LiveIcon),
  // Lock:         configIcon(LockIcon),
  // Message:      configIcon(MessageIcon),
  // Plus:         configIcon(PlusIcon, option),
  // Post:         configIcon(PostIcon),
  // Verified:     configIcon(VerifiedIcon, { baseColor: 'primary', size: 'sm' }),
} 

export default Icons;
