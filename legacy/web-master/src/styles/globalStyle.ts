// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { createGlobalStyle } from 'styled-components';

import { mediaQuery } from './Globals';

export default createGlobalStyle`
// Font hierarchy a designed here
// https://www.figma.com/file/wAwsA7hzw7XrXfQdn5gFrE/Backchannel-v1-DO-NOT-SHARE?node-id=440%3A15431
  * {
    color: ${({ theme }) => theme.fontPrimary};
    text-align: left;
    margin: 0px;
    padding: 0px;
  }

  ::-webkit-scrollbar {
    cursor: pointer;
    width: 8px;
    ${mediaQuery.sm} {
      width: 0px;
    }
  }
  /* Track */
  ::-webkit-scrollbar-track {
    background: inherit;
    border: 1px solid ${({ theme }) => theme.backgroundMedium};
    border-radius: 6px;
  }
  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.backgroundLight};
    border-radius: 6px;
    border: 1px outset ${({ theme }) => theme.primary};
  }
  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.primary};
  }

  #root{
    position: fixed;
    top: 0;
    left: 0;
    background-color: ${({ theme }) => theme.backgroundDark};
    text-align: left;
    height: 100%;
    max-height: 100vh;
    width: 100vw;
    overflow-y: auto;
    overflow-x: hidden;
    color-scheme: ${({ theme }) => theme.colorScheme};
  }

  @font-face {
    font-family: 'VisueltPro';
    src:  url('../fonts/Visuelt/VisueltPro-Regular.woff') format('woff'), /* Chrome 6+, Firefox 3.6+, IE 9+, Safari 5.1+ */
          url('../fonts/Visuelt/VisueltPro-Regular.ttf')  format('truetype'); /* Chrome 4+, Firefox 3.5, Opera 10+, Safari 3—5 */
  }

  h1, h2, h3, h4, h5, h6 {
    user-select: none;
    margin: 0px;
    padding: 0px;
  }

  h1 {
    font-weight: bold;
    font-size: 32px;
    line-height: 32px;
    color: ${({ theme }) => theme.fontFocus};
  }

  h2 {
    font-weight: bold;
    font-size: 24px;
    line-height: 32px;
    color: ${({ theme }) => theme.fontFocus};
  }

  h3 {
    font-weight: bold;
    font-size: 20px;
    line-height: 26px;
    color: ${({ theme }) => theme.fontPrimary};
  }

  h4 {
    font-weight: normal;
    font-size: 16px;
    line-height: 20px;
    color: ${({ theme }) => theme.fontTertiary};
  }

  // h5 & h6 are our subtitles
  h5 {
    font-weight: normal;
    font-size: 14px;
    line-height: 20px;
    color: ${({ theme }) => theme.fontTertiary};
  }

  h6 {
    font-weight: normal;
    font-size: 14px;
    line-height: 20px;
    color: ${({ theme }) => theme.fontTertiary};
  }

  p {
    color: ${({ theme }) => theme.fontSecondary};
    font-size: 16px;
    line-height: 24px;
  }

  a {
    color: ${({ theme }) => theme.primary};
    text-decoration: underline;
  }

`;
