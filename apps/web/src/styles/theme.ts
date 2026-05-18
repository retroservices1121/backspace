import { DefaultTheme } from 'styled-components';

export enum Themes {
  Dark = 'dark',
  Light = 'light',
}

// Primary Theme — realigned to the new design tokens
// (apps/web/src/styles/globals.css :root). Every styled-component that
// references theme.X — community shells, channel input, legacy modals
// — now picks up brand purple instead of the old #09A0F1 blue, and the
// surfaces sit on the new canvas / surface / surface-2 stack instead of
// pure greys. This is the single point where the legacy palette meets
// the new token system; changing one value here updates everything in
// the styled-components world.
const dark: DefaultTheme = {
  primary:          '#5822FB',                  // brand (was #09A0F1 blue)
  primary_rgb:      '88,34,251',
  secondary:        '#7B4CFF',                  // brand-2
  tertiary:         '#FFB44C',                  // gold accent
  fontFocus:        '#FFFFFF',                  // ink
  fontPrimary:      '#FFFFFF',                  // ink (was #E1E1E1)
  fontSecondary:    'rgba(255,255,255,0.72)',   // ink-2
  fontTertiary:     'rgba(255,255,255,0.5)',    // ink-3
  backgroundNormal: '#0f0d1a',                  // surface (was #1B1B1B)
  backgroundMedium: '#0c0a16',                  // bg-2
  backgroundLight:  '#16142a',                  // surface-2 (was #242424)
  backgroundDark:   '#08070d',                  // canvas
  dividerColor:     'rgba(255,255,255,0.08)',   // line
  iconColor:        '#FFFFFF',                  // ink
  verified:         '#7B4CFF',                  // brand-2
  colorScheme:      'dark',
  none:             'transparent',
  error:            '#ff5470',                  // pink
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
