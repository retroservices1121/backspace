// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History
import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    primary: string;
    primary_rgb: string;
    secondary: string;
    tertiary: string;
    fontFocus: string;
    fontPrimary: string;
    fontSecondary: string;
    fontTertiary: string;
    backgroundNormal: string;
    backgroundMedium: string;
    backgroundLight: string;
    backgroundDark: string;
    dividerColor: string;
    iconColor: string;
    colorScheme: string;
    none: string;
    error: string;
    white: 'white';
    black: 'black';
  }
}