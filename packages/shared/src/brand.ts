/**
 * Backspace brand tokens shared by the native app (and, later, web).
 *
 * These mirror the "new design tokens" block in apps/web/tailwind.config.js
 * (canvas, surface, ink, line, brand, ...). Keep this file plain TypeScript
 * that compiles with TS 4.6: no `satisfies`, no const type parameters, no
 * decorators, no DOM/React/Node APIs.
 */

export const colors = {
  canvas: '#08070D',
  canvasRaised: '#0C0A16',
  surface: '#0F0D1A',
  surfaceRaised: '#16142A',
  ink: '#FFFFFF',
  ink2: 'rgba(255,255,255,0.72)',
  ink3: 'rgba(255,255,255,0.48)',
  line: 'rgba(255,255,255,0.09)',
  lineStrong: 'rgba(255,255,255,0.16)',
  brand: '#5822FB',
  brand2: '#7B4CFF',
  brandSoft: 'rgba(88,34,251,0.14)',
  green: '#0EAD69',
  green2: '#3BD691',
  pink: '#FF5470',
  pink2: '#FF8A9B',
  gold: '#FFB44C',
} as const;

export const radii = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export type ColorToken = keyof typeof colors;
export type RadiusToken = keyof typeof radii;
export type SpacingToken = keyof typeof spacing;
