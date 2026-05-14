import { DefaultTheme } from 'styled-components';

export enum Themes {
  Dark = 'dark',
  Light = 'light',
}

// Primary Theme
const dark: DefaultTheme = {
  primary:          '#09A0F1',
  primary_rgb:      '9,160,241',
  secondary:        '#0EBD7E',
  tertiary:         '#FFB21D',
  fontFocus:       '#FFFFFF',
  fontPrimary:      '#E1E1E1',
  fontSecondary:    '#ACACAC',
  fontTertiary:     '#8C8C8C',
  backgroundNormal: '#1B1B1B',
  backgroundMedium: '#131313',
  backgroundLight:  '#242424',
  backgroundDark:   '#000000',
  dividerColor:     '#202329',
  iconColor:        '#E1E1E1',
  verified:         '#8A24FF',
  verifiedOrg:      '#FFB21D',
  colorScheme:      'dark',
  none:             'transparent',
  error:            '#F44464',
  white:            'white',
  black:            'black',
};

const light: DefaultTheme = {
  primary:          '#09A0F1',
  primary_rgb:      '9,160,241',
  secondary:        '#0EBD7E',
  tertiary:         '#8A24FF',
  fontFocus:        '#000000',
  fontPrimary:      '#181C1E',
  fontSecondary:    '#46535A',
  fontTertiary:     '#A1ACB2',
  backgroundNormal: '#FAFAFA',
  backgroundMedium: '#FFFFFF', //Swapped with backgroundLight
  backgroundLight:  '#F6F6F6', //Swapped with backgroundMedium
  backgroundDark:   '#F0F0F0',
  dividerColor:     '#F0F0F0',
  iconColor:        '#181C1E',
  verified:         '#8A24FF',
  verifiedOrg:      '#FFB21D',
  colorScheme:      'light',
  none:             'transparent',
  error:            '#F44464',
  white:            'white',
  black:            'black',
};

export const themes = {
  [Themes.Dark]: dark,
  [Themes.Light]: light,
};

export const debugColor = '#997aff';
