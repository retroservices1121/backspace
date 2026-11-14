import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Height of the tab bar above the bottom safe-area inset (icons + labels + top padding). */
export const TAB_BAR_CONTENT_HEIGHT = 56;
/** Bottom padding on devices without a home indicator / gesture bar inset. */
export const TAB_BAR_MIN_BOTTOM_PADDING = 8;

/**
 * Layout of the absolutely positioned tab bar. Scrollable tab screens pad their content by `height`
 * so the last controls can scroll clear of the bar.
 */
export function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_PADDING);
  return { height: TAB_BAR_CONTENT_HEIGHT + bottom, bottom };
}
