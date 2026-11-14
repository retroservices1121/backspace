import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { BagIcon, CommunitiesIcon, MarketsIcon, MessagesIcon, UserIcon } from '@/components/icons';
import { colors } from '@/constants/theme';
import { useTabBarHeight } from '@/hooks/use-tab-bar-height';
import { FEATURE_MARKETS } from '@/lib/flags';

function iconColor(focused: boolean) { return focused ? colors.brand2 : colors.ink3; }

/** Titles of the tabs that actually render a button, in bar order. */
const VISIBLE_TABS = FEATURE_MARKETS ? ['Communities', 'Messages', 'Markets', 'Portfolio', 'Profile'] : ['Communities', 'Messages', 'Profile'];

/**
 * The default iOS label is "<title>, tab, N of M", where M counts every route, including hidden ones
 * (flag-off Profile would be "5 of 5"). Number only the visible tabs. Android keeps the plain title and
 * TalkBack announces the tab role.
 */
function a11yLabel(title: string) {
  if (Platform.OS !== 'ios') return title;
  return `${title}, tab, ${VISIBLE_TABS.indexOf(title) + 1} of ${VISIBLE_TABS.length}`;
}

export default function TabLayout() {
  const { height, bottom } = useTabBarHeight();
  // With the flag off the routes still exist (and redirect to "/"), but href: null removes the tab
  // button and no title or label is provided, so nothing market-related is shown.
  const hidden = { href: null } as const;
  return <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.canvas }, tabBarActiveTintColor: colors.ink, tabBarInactiveTintColor: colors.ink3, tabBarLabelStyle: styles.label, tabBarStyle: [styles.bar, { height, paddingBottom: bottom }] }}>
    <Tabs.Screen name="communities" options={{ title: 'Communities', tabBarAccessibilityLabel: a11yLabel('Communities'), tabBarIcon: ({ focused }) => <CommunitiesIcon color={iconColor(focused)} /> }} />
    <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarAccessibilityLabel: a11yLabel('Messages'), tabBarIcon: ({ focused }) => <MessagesIcon color={iconColor(focused)} /> }} />
    <Tabs.Screen name="markets" options={FEATURE_MARKETS ? { title: 'Markets', tabBarAccessibilityLabel: a11yLabel('Markets'), tabBarIcon: ({ focused }) => <MarketsIcon color={iconColor(focused)} /> } : hidden} />
    <Tabs.Screen name="portfolio" options={FEATURE_MARKETS ? { title: 'Portfolio', tabBarAccessibilityLabel: a11yLabel('Portfolio'), tabBarIcon: ({ focused }) => <BagIcon color={iconColor(focused)} /> } : hidden} />
    <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarAccessibilityLabel: a11yLabel('Profile'), tabBarIcon: ({ focused }) => <UserIcon color={iconColor(focused)} /> }} />
  </Tabs>;
}
const styles = StyleSheet.create({ bar: { position: 'absolute', backgroundColor: 'rgba(8,7,13,0.98)', borderTopColor: colors.line, paddingTop: 7 }, label: { fontSize: 10, fontWeight: '600', marginTop: 2 } });
