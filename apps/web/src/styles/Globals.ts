// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled, { css, DefaultTheme } from 'styled-components';

type SVGProps = {
  $solid?: boolean;
  $active?: boolean;
  $activeColor?: keyof DefaultTheme;
  $clickable?: boolean;
  $color?: keyof DefaultTheme;
};


const constants = {
  // Globally Referenced CSS Values
  NAVIGATION_HEIGHT: '80px',
  INPUTBLOCK_HEIGHT: '70px',
  DRAWER_WIDTH: '362px',
  DRAWER_TAB: '20px',

  // Screen Sizing Thresholds
  SMALLSCREEN_WIDTH: '450px',
  MEDIUMSCREEN_WIDTH: '750px',
};

const BaseIcon = styled.svg<SVGProps>`

`;

export const Icon = styled(BaseIcon).attrs<SVGProps>(({ $color, $activeColor, theme }) => ({
  $color: $color ? theme[$color] : theme.iconColor,
  $activeColor: $activeColor ? theme[$activeColor] : theme.fontFocus,
}))`

  width: ${({ width }) => width ? width : '20px'};
  height: ${({ height }) => height ? height : '20px'};
  stroke: ${({ $solid: solid, $color: color }) => !solid ? color : 'none'};
  fill: ${({ $solid: solid, $color: color }) => solid ? color : 'none'};

  /* If Active */
  ${({ $active, $solid, $activeColor }) => $active && css`
    stroke: ${!$solid && $active ? $activeColor : 'none'};
    fill: ${$solid && $active ? $activeColor : 'none'};
  `}

  ${({ $clickable, $solid, theme }) => $clickable && css`
    cursor: pointer;
    &:hover {
      stroke: ${!$solid ? theme.primary : 'none'};
      fill: ${$solid ? theme.primary : 'none'};
    }
  `}
`;

export const TinyIcon = styled(Icon)`
  width: 5px;
  height: 5px;
  margin: 1px;
`;

export const SmallIcon = styled(Icon)`
  width: 10px;
  height: 10px;
  margin: 2px;
`;

export const LargeIcon = styled(Icon)`
  width: 30px;
  height: 30px;
  margin: 2px;
`;


const breakPoints = {
  sm: '450px',
  md: '750px',
};

export const disableScrollbar = css`
  scrollbar-width: 0px;
  ::-webkit-scrollbar {
    width: 0;  /* Remove scrollbar space */
    background: transparent;  /* Optional: just make scrollbar invisible */
  }
`;

export const mediaQuery = {
  sm: `@media screen and (max-width: ${breakPoints.sm})`,
  // TODO message for Dylan, md now has max since we're styling from largest to smallest
  // Its better to not use the md if thats going to be the "default"
  md: `@media screen and (max-width: ${breakPoints.md})`,
};

export const ColoredSpan = styled.span`
  color: ${({ theme }) => theme.primary}
`;


export default constants;
