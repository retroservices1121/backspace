/* eslint-disable @typescript-eslint/indent */
// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import { ReactComponent as BackIcon } from 'icons/arrow/left.svg';
import { ReactComponent as CheckIcon } from 'icons/check.svg';
import { ReactComponent as ChatIcon } from 'icons/comment.svg';
import { ReactComponent as MoreIcon } from 'icons/dots-horizontal.svg';
import { ReactComponent as EyeIcon } from 'icons/eye.svg';
import { ReactComponent as HiddenIcon } from 'icons/eye-slash.svg';
import { ReactComponent as GridIcon } from 'icons/grid.svg';
import { ReactComponent as HeartIcon } from 'icons/heart.svg';
import { ReactComponent as LockIcon } from 'icons/lock.svg';
import { ReactComponent as MenuIcon } from 'icons/menu.svg';
import { ReactComponent as MessageIcon } from 'icons/message-dots.svg';
import { ReactComponent as MoonIcon } from 'icons/moon.svg';
import { ReactComponent as PlusIcon } from 'icons/plus.svg';
import { ReactComponent as PostIcon } from 'icons/post.svg';
import { ReactComponent as SearchIcon } from 'icons/search.svg';
import { ReactComponent as SendIcon } from 'icons/send.svg';
import { ReactComponent as ShareIcon } from 'icons/share-reply.svg';
import { ReactComponent as LiveIcon } from 'icons/signal-live.svg';
import { ReactComponent as SunIcon } from 'icons/sun.svg';
import { ReactComponent as VerifiedIcon } from 'icons/verified.svg';
import { ReactComponent as XIcon } from 'icons/x.svg';
import styled, { css, DefaultTheme, StyledComponent } from 'styled-components';

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
  hoverColor: keyof DefaultTheme;
  /** Set SVG size using defaults 'sm, md, lg' */
  size: 'sm' | 'md' | 'lg' | undefined;
};

const defaultIconOptions : IconOptions = {
  width: '20px',
  height: '20px',
  margin: '2px',
  color: 'fontFocus',
  active: false, 
  activeColor: 'primary',
  allowFill: true,
  clickable: false,
  hoverColor: 'primary',
  size: undefined,
  className: '',
};

const StyledIcon = styled.svg<IconOptions>`
  width: ${({ width }) => width};
  height: ${({ height }) => height};
  margin: ${({ margin }) => margin};
  ${({ allowFill, color, theme }) => css`
    fill: ${allowFill ? theme[color] : theme.none};
    stroke: ${theme[color]};
  `}
  /** If Active */
  ${({ theme, active, activeColor, allowFill }) => active && css`
    fill: ${allowFill ? theme[activeColor] : theme.none};
    stroke: ${theme[activeColor]};
  `}
  ${({ theme, clickable, allowFill, hoverColor }) => clickable && css`
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
export function makeIcon(svgIcon: React.FC<any>, baseSvg: StyledComponent<any, any> = baseSVG) {
  return styled(baseSvg).attrs((props: any) => ({ as: svgIcon, ...props }))``;
}

class Icons {
  static Back     = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(BackIcon, option);
  static Chat     = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(ChatIcon, option);
  static Close    = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(XIcon, option);
  static Check    = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(CheckIcon, option);
  static Eye     = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(EyeIcon, option);
  static Grid     = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(GridIcon, option);
  static Heart    = (option: Partial<IconOptions> = { ...defaultIconOptions, allowFill: false }) => configIcon(HeartIcon, option);
  static Hidden   = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(HiddenIcon, option);
  static Live     = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(LiveIcon, option);
  static Lock     = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(LockIcon, option);
  static Message  = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(MessageIcon, option);
  static Menu     = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(MenuIcon, option);
  static Moon     = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(MoonIcon, option);
  static More     = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(MoreIcon, option);
  static Plus     = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(PlusIcon, option);
  static Post     = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(PostIcon, option);
  static Send     = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(SendIcon, option);
  static Search   = (option: Partial<IconOptions> = { ...defaultIconOptions, allowFill: false }) => configIcon(SearchIcon, option);
  static Share    = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(ShareIcon, option);
  static Sun      = (option: Partial<IconOptions> = defaultIconOptions) => configIcon(SunIcon, option);
  static Verified = (option: Partial<IconOptions> = { ...defaultIconOptions, color: 'primary', size: 'sm' }) => configIcon(VerifiedIcon, option);
  // Grid:         configIcon(GridIcon),
  // Live:         configIcon(LiveIcon),
  // Lock:         configIcon(LockIcon),
  // Message:      configIcon(MessageIcon),
  // Plus:         configIcon(PlusIcon, option),
  // Post:         configIcon(PostIcon),
  // Verified:     configIcon(VerifiedIcon, { baseColor: 'primary', size: 'sm' }),
} 

export default Icons;
