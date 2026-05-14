// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Styling for the compact composer media control.

import ReactPlayer from 'react-player';
import styled, { css } from 'styled-components';

import { Icon } from 'styles/Globals';
import { mediaQuery } from 'styles/Globals';

type Props = {
  show : boolean
};

// Small circular icon button that opens the file picker — sits in the
// composer body like X's media button.
export const AttachButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 6px;
  margin: 4px 0;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: ${({ theme }) => theme.primary};

  svg {
    width: 20px;
    height: 20px;
    /* upload.svg is a stroke-based icon (fill="none") and ships with an
       invalid stroke="current" — without an explicit stroke here it
       draws nothing and the button looks empty. */
    fill: none;
    stroke: ${({ theme }) => theme.primary};
  }

  &:hover {
    background-color: ${({ theme }) => theme.backgroundLight};
    svg { stroke: ${({ theme }) => theme.fontFocus}; }
  }
`;

// Holds the chosen image/video preview plus the remove control.
export const PreviewWrapper = styled.div`
  position: relative;
  width: 100%;
  margin: 8px 0 4px;
  border-radius: 16px;
  overflow: hidden;
`;

export const MediaPreview = styled.img<Props>`
  display: block;
  width: 100%;
  height: auto;
  max-height: 280px;
  object-fit: cover;

  ${({ show }) => !show && css`
    display: none;
  `}
`;

export const MediaPlayer = styled(ReactPlayer)`
  border-radius: 16px;
  width: 100%;
  height: auto;
  max-height: 280px;
  object-fit: cover;
  ${mediaQuery.sm} {
    max-height: 240px;
  }
`;

export const RemoveMediaIcon = styled(Icon)`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1; //On Top of Image
`;
