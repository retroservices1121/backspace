import { isApiError } from '@backspace/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/auth/session';
import { BrandHeader } from '@/components/brand-header';
import { colors } from '@/constants/theme';
import { useMe } from '@/hooks/use-me';
import { useTabBarHeight } from '@/hooks/use-tab-bar-height';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets(); const session = useSession(); const me = useMe(); const queryClient = useQueryClient();
  const { height: tabBarHeight } = useTabBarHeight();
  const [signingOut, setSigningOut] = useState(false);
  const user = me.data ?? null;
  const email = session.user?.email ?? null;
  const name = user?.name || email || 'Backspace member';
  const handle = user ? `@${user.username}` : email;
  // Only a successful JSON null means "no profile yet"; a failed request is never treated as onboarding.
  const needsProfile = me.isSuccess && me.data === null;
  const sessionExpired = me.isError && isApiError(me.error) && me.error.status === 401;
  const loadFailed = me.isError && !sessionExpired;

  async function signOut() {
    setSigningOut(true);
    try {
      await session.logout();
      queryClient.clear();
      router.replace('/sign-in');
    } finally { setSigningOut(false); }
  }

  return <View style={[styles.screen, { paddingTop: insets.top }]}><BrandHeader section="Profile" /><ScrollView style={styles.scroll} contentContainerStyle={[styles.body, { paddingBottom: tabBarHeight + 30 }]} scrollIndicatorInsets={{ bottom: tabBarHeight }}>{session.user ? <>
    <View style={styles.avatar}><Text style={styles.avatarText}>{name.slice(0, 1).toUpperCase()}</Text></View>
    <Text style={styles.title} numberOfLines={1}>{name}</Text>
    {me.isLoading ? <ActivityIndicator color={colors.brand2} style={styles.loading} /> : handle && handle !== name ? <Text style={styles.handle} numberOfLines={1}>{handle}</Text> : null}
    {needsProfile ? <Text style={styles.copy}>Finish creating your Backspace profile to choose a username.</Text> : null}
    {sessionExpired ? <View style={styles.error} accessibilityRole="alert"><Text style={styles.errorTitle}>Your session has expired</Text><Text style={styles.errorText}>Sign in again to load your Backspace profile.</Text><Pressable disabled={signingOut} onPress={signOut} style={styles.retry}><Text style={styles.retryText}>Sign in again</Text></Pressable></View> : null}
    {loadFailed ? <View style={styles.error} accessibilityRole="alert"><Text style={styles.errorTitle}>Could not load your profile</Text><Text style={styles.errorText}>{me.error instanceof Error ? me.error.message : 'Something went wrong.'}</Text><Pressable disabled={me.isFetching} onPress={() => me.refetch()} style={[styles.retry, me.isFetching && styles.disabled]}>{me.isFetching ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.retryText}>Try again</Text>}</Pressable></View> : null}
    <View style={styles.status}><View style={styles.dot} /><View style={styles.statusCopy}><Text style={styles.statusTitle}>Signed in{email ? ` as ${email}` : ''}</Text><Text style={styles.statusText}>Your session is stored encrypted on this device.</Text></View></View>
    <Pressable disabled={signingOut} onPress={signOut} style={[styles.secondary, signingOut && styles.disabled]}><Text style={styles.secondaryText}>Sign out</Text></Pressable>
  </> : <>
    <View style={styles.avatar}><Text style={styles.avatarText}>B</Text></View>
    <Text style={styles.title}>Your Backspace identity</Text>
    <Text style={styles.copy}>Sign in to post, follow people, and join communities.</Text>
    <Pressable onPress={() => router.push('/sign-in')} style={styles.button}><Text style={styles.buttonText}>Sign in or create account</Text></Pressable>
  </>}</ScrollView></View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas }, scroll: { flex: 1 }, body: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }, avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.ink, fontSize: 27, fontWeight: '900' }, title: { color: colors.ink, fontSize: 23, fontWeight: '800', textAlign: 'center', marginTop: 19, maxWidth: 320 }, handle: { color: colors.brand2, fontSize: 14, fontWeight: '700', maxWidth: 290, marginTop: 7 }, loading: { marginTop: 9 }, copy: { color: colors.ink3, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10, maxWidth: 350 }, button: { backgroundColor: colors.brand, borderRadius: 16, paddingHorizontal: 22, paddingVertical: 15, marginTop: 24, minWidth: 230, alignItems: 'center' }, buttonText: { color: colors.ink, fontWeight: '800' }, status: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14, marginTop: 22 }, dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green2 }, statusCopy: { flex: 1 }, statusTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' }, statusText: { color: colors.ink3, fontSize: 11, marginTop: 3 }, secondary: { marginTop: 20, borderRadius: 14, borderWidth: 1, borderColor: colors.lineStrong, paddingHorizontal: 22, paddingVertical: 12 }, secondaryText: { color: colors.ink2, fontWeight: '700' }, disabled: { opacity: 0.6 }, error: { width: '100%', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 16, padding: 16, marginTop: 18 }, errorTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', textAlign: 'center' }, errorText: { color: colors.ink3, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 5 }, retry: { marginTop: 12, minWidth: 130, minHeight: 40, borderRadius: 12, backgroundColor: colors.brand, paddingHorizontal: 18, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' }, retryText: { color: colors.ink, fontWeight: '800' } });
