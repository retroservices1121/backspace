import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BagIcon, CommunitiesIcon, MarketsIcon, MessagesIcon, UserIcon } from '@/components/icons';
import { colors } from '@/constants/theme';
import { FEATURE_MARKETS } from '@/lib/flags';

/** Height of the tab bar above the bottom safe-area inset (icons + labels + top padding). */
const TAB_BAR_CONTENT_HEIGHT = 56;
/** Bottom padding on devices without a home indicator / gesture bar inset. */
const MIN_BOTTOM_PADDING = 8;

function iconColor(focused: boolean) { return focused ? colors.brand2 : colors.ink3; }

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, MIN_BOTTOM_PADDING);
  // With the flag off the routes still exist (and redirect to "/"), but href: null removes the tab
  // button and no title or label is provided, so nothing market-related is shown.
  const hidden = { href: null } as const;
  return <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.canvas }, tabBarActiveTintColor: colors.ink, tabBarInactiveTintColor: colors.ink3, tabBarLabelStyle: styles.label, tabBarStyle: [styles.bar, { height: TAB_BAR_CONTENT_HEIGHT + bottom, paddingBottom: bottom }] }}>
    <Tabs.Screen name="communities" options={{ title: 'Communities', tabBarIcon: ({ focused }) => <CommunitiesIcon color={iconColor(focused)} /> }} />
    <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: ({ focused }) => <MessagesIcon color={iconColor(focused)} /> }} />
    <Tabs.Screen name="markets" options={FEATURE_MARKETS ? { title: 'Markets', tabBarIcon: ({ focused }) => <MarketsIcon color={iconColor(focused)} /> } : hidden} />
    <Tabs.Screen name="portfolio" options={FEATURE_MARKETS ? { title: 'Portfolio', tabBarIcon: ({ focused }) => <BagIcon color={iconColor(focused)} /> } : hidden} />
    <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <UserIcon color={iconColor(focused)} /> }} />
  </Tabs>;
}
const styles = StyleSheet.create({ bar: { position: 'absolute', backgroundColor: 'rgba(8,7,13,0.98)', borderTopColor: colors.line, paddingTop: 7 }, label: { fontSize: 10, fontWeight: '600', marginTop: 2 } });
