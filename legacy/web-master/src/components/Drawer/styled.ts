// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Styling
import styled, { css, DefaultTheme } from 'styled-components';

import constants, { mediaQuery } from 'styles/Globals';
import Zindex from 'styles/zindex';

type Props = {
  expand?: boolean;
  color?: keyof DefaultTheme;
  side: 'left' | 'right';
  hideOnMobile?: boolean;
};

type ContentProps = {
  invisibleScroll?: boolean;
  side: 'left' | 'right';
  allowOverFlow?: boolean;
};

export const DrawerContent = styled.div<ContentProps>`
  height: 100%;
  width: 100%;
  transition: visibility 0.5s, opacity 0.30s linear;
  ${({ allowOverFlow }) => allowOverFlow === false && css`
    overflow: auto;
   `}
  ${({ invisibleScroll }) => invisibleScroll && css`
    ::-webkit-scrollbar {
      width: 0;  /* Remove scrollbar space */
      background: transparent;  /* Optional: just make scrollbar invisible */
    }
  `}
  ${({ side }) => side === 'left' && css`
    direction: rtl; //Left-hand scrollbar
    * { //Fixing content after direction=rtl
      direction: ltr;
    }
  `}
`;


export const Panel = styled.div<Props>`
  position: relative; /* Stay in place */
  top: 0; /* Stay at the top */
  ${({ side }) => side === 'left' && css`
    left: 0;
  `}
  ${({ side }) => side === 'right' && css`
    right: 0;
  `}
  
  ${mediaQuery.sm} {
    position: fixed;
    max-height: calc(100% - ${constants.NAVIGATION_HEIGHT});
    max-width: calc(100vw - 20px); // So it doesn't overflow mobile
    z-index: ${Zindex.Drawer};
  }
  width: 20px;
  height: 100%;
  max-width: 20px;
  min-width: 20px; //Matches tab width
  background-color: ${({ theme, color }) => (color && theme[color]) || 'transparent'};
  transition: width 0.5s; /* 0.5 second transition effect to slide in the sidenav */

  ${DrawerContent} {
    visibility: hidden;
    opacity: 0;
  }

  /* If Expand == True */
  ${({ expand }) => expand && css`
    width: ${constants.DRAWER_WIDTH};
    min-width: ${constants.DRAWER_WIDTH};
    max-width: ${constants.DRAWER_WIDTH};
    ${DrawerContent} {
      visibility: visible;
      opacity: 1;
    }
    ${mediaQuery.sm} {
      width: 100vw;
      min-width: 100vw;
      max-width: 100vw;
    }
  `}

  ${mediaQuery.sm} {
    ${({ hideOnMobile }) => hideOnMobile && css`
      display: none;
    `}
  }
`;


export const Tab = styled.div<Props>`
  cursor: pointer;
  position: absolute;
  ${({ side }) => side === 'left' && css`
    writing-mode: vertical-lr;
    right: 0;
  `}
  ${({ side }) => side === 'right' && css`
    writing-mode: vertical-rl;
    left: 0;
  `}
  width: 20px;
  height: inherit;
  z-index: 1;

  padding-top: 50px;

  text-align: left;
  text-orientation: mixed;

  line-height: 20px;

  color: ${({ theme }) => theme.fontSecondary};

  &:hover {
    color: ${({ theme }) => theme.primary};
    font-size: 1.1em;
    /* border: 1px solid ${({ theme }) => theme.fontTertiary}; */
  }
`;




