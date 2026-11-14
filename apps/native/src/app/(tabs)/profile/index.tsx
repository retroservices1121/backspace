import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthGate } from '@/auth/auth-gate';
import { useSession } from '@/auth/session';
import { BrandHeader } from '@/components/brand-header';
import { colors } from '@/constants/theme';
import { useMe } from '@/hooks/use-me';
import { useTabBarHeight } from '@/hooks/use-tab-bar-height';

/** Only reachable when the auth gate is `ready` (signed in with a Backspace profile). */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets(); const session = useSession(); const me = useMe(); const gate = useAuthGate();
  const { height: tabBarHeight } = useTabBarHeight();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const user = me.data ?? null;
  const email = session.user?.email ?? null;
  const name = user?.name || email || 'Backspace member';
  const handle = user ? `@${user.username}` : email;
  // A background refresh can fail while the cached profile is still shown.
  const refreshFailed = me.isError && Boolean(user);

  async function signOut() {
    setSigningOut(true); setSignOutError(null);
    try {
      await gate.signOut();
      router.replace('/sign-in');
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Could not sign out.');
    } finally { setSigningOut(false); }
  }

  return <View style={[styles.screen, { paddingTop: insets.top }]}><BrandHeader section="Profile" /><ScrollView style={styles.scroll} contentContainerStyle={[styles.body, { paddingBottom: tabBarHeight + 30 }]} scrollIndicatorInsets={{ bottom: tabBarHeight }}>
    <View style={styles.avatar}><Text style={styles.avatarText}>{name.slice(0, 1).toUpperCase()}</Text></View>
    <Text style={styles.title} numberOfLines={1}>{name}</Text>
    {me.isLoading ? <ActivityIndicator color={colors.brand2} style={styles.loading} /> : handle && handle !== name ? <Text style={styles.handle} numberOfLines={1}>{handle}</Text> : null}
    {refreshFailed ? <View style={styles.error} accessibilityRole="alert"><Text style={styles.errorTitle}>Could not refresh your profile</Text><Text style={styles.errorText}>{me.error instanceof Error ? me.error.message : 'Something went wrong.'}</Text><Pressable disabled={me.isFetching} onPress={() => me.refetch()} style={[styles.retry, me.isFetching && styles.disabled]}>{me.isFetching ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.retryText}>Try again</Text>}</Pressable></View> : null}
    <View style={styles.status}><View style={styles.dot} /><View style={styles.statusCopy}><Text style={styles.statusTitle}>Signed in{email ? ` as ${email}` : ''}</Text><Text style={styles.statusText}>Your session is stored encrypted on this device.</Text></View></View>
    <Pressable disabled={signingOut} onPress={signOut} style={[styles.secondary, signingOut && styles.disabled]}>{signingOut ? <ActivityIndicator color={colors.ink2} /> : <Text style={styles.secondaryText}>Sign out</Text>}</Pressable>
    {signOutError ? <Text style={styles.signOutError} accessibilityRole="alert">{signOutError}</Text> : null}
  </ScrollView></View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, scroll: { flex: 1 }, body: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }, avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.ink, fontSize: 27, fontWeight: '900' }, title: { color: colors.ink, fontSize: 23, fontWeight: '800', textAlign: 'center', marginTop: 19, maxWidth: 320 }, handle: { color: colors.brand2, fontSize: 14, fontWeight: '700', maxWidth: 290, marginTop: 7 }, loading: { marginTop: 9 }, status: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14, marginTop: 22 }, dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green2 }, statusCopy: { flex: 1 }, statusTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' }, statusText: { color: colors.ink3, fontSize: 11, marginTop: 3 }, secondary: { marginTop: 20, minWidth: 120, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.lineStrong, paddingHorizontal: 22, paddingVertical: 12 }, secondaryText: { color: colors.ink2, fontWeight: '700' }, signOutError: { color: colors.pink2, fontSize: 13, textAlign: 'center', marginTop: 12 }, disabled: { opacity: 0.6 }, error: { width: '100%', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 16, padding: 16, marginTop: 18 }, errorTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', textAlign: 'center' }, errorText: { color: colors.ink3, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 5 }, retry: { marginTop: 12, minWidth: 130, minHeight: 40, borderRadius: 12, backgroundColor: colors.brand, paddingHorizontal: 18, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' }, retryText: { color: colors.ink, fontWeight: '800' } });
