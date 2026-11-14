/**
 * Brand tokens live in the shared workspace package so web and native stay in sync.
 * This module re-exports them so existing `@/constants/theme` imports keep working.
 */
export { colors, radii, spacing } from '@backspace/shared';
export type { ColorToken, RadiusToken, SpacingToken } from '@backspace/shared';
