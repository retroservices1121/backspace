/**
 * Build-time feature flags. EXPO_PUBLIC_* values are inlined when the bundle is built,
 * so changing them requires restarting Metro or making a new build.
 */

/** Gate markets and portfolio. Off unless EXPO_PUBLIC_FEATURE_MARKETS is exactly "true". */
export const FEATURE_MARKETS = process.env.EXPO_PUBLIC_FEATURE_MARKETS === 'true';
