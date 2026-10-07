import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { BagIcon, HomeIcon, MarketsIcon, PlusIcon, UserIcon } from '@/components/icons';
import { colors } from '@/constants/theme';
function iconColor(focused: boolean) { return focused ? colors.brand2 : colors.ink3; }
export default function TabLayout() {
  return <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.canvas }, tabBarActiveTintColor: colors.ink, tabBarInactiveTintColor: colors.ink3, tabBarLabelStyle: styles.label, tabBarStyle: styles.bar }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ focused }) => <HomeIcon color={iconColor(focused)} /> }} />
    <Tabs.Screen name="markets" options={{ title: 'Markets', tabBarIcon: ({ focused }) => <MarketsIcon color={iconColor(focused)} /> }} />
    <Tabs.Screen name="compose" options={{ title: '', tabBarIcon: () => <View style={styles.compose}><PlusIcon color={colors.ink} /></View> }} />
    <Tabs.Screen name="portfolio" options={{ title: 'Portfolio', tabBarIcon: ({ focused }) => <BagIcon color={iconColor(focused)} /> }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <UserIcon color={iconColor(focused)} /> }} />
  </Tabs>;
}
const styles = StyleSheet.create({ bar: { position: 'absolute', backgroundColor: 'rgba(8,7,13,0.98)', borderTopColor: colors.line, height: Platform.OS === 'ios' ? 86 : 70, paddingTop: 7 }, label: { fontSize: 10, fontWeight: '600', marginTop: 2 }, compose: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: colors.brand, shadowOpacity: 0.55, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 10 } });
