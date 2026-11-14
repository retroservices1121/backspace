import { Redirect, router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gateHome, useAuthGate } from '@/auth/auth-gate';
import { Wordmark } from '@/components/brand/wordmark';
import { colors } from '@/constants/theme';

/**
 * Entry route and the gate's fallback screen. It is never protected, so Expo Router lands here whenever
 * a guarded route is denied. It forwards to sign-in, onboarding or the tabs, and otherwise shows a
 * branded loading state (never the tabs) or a retry state when the profile could not be loaded.
 */
export default function Index() {
  const gate = useAuthGate(); const insets = useSafeAreaInsets();
  const home = gateHome(gate.status);
  if (home) return <Redirect href={home} />;

  async function switchAccount() {
    try { await gate.signOut(); router.replace('/sign-in'); } catch { /* the gate shows the expired state */ }
  }

  return <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
    <Wordmark width={190} />
    {gate.status === 'loading' ? <ActivityIndicator accessibilityLabel="Loading" color={colors.brand2} style={styles.spinner} /> : null}
    {gate.status === 'error' ? <View style={styles.card} accessibilityRole="alert">
      <Text style={styles.title}>We couldn’t load your account</Text>
      <Text style={styles.copy}>{gate.error ?? 'Something went wrong.'}</Text>
      <Pressable accessibilityRole="button" disabled={gate.retrying} onPress={gate.retry} style={[styles.button, gate.retrying && styles.disabled]}>{gate.retrying ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.buttonText}>Try again</Text>}</Pressable>
      <Pressable accessibilityRole="button" disabled={gate.retrying} onPress={switchAccount}><Text style={styles.link}>Use a different account</Text></Pressable>
    </View> : null}
    {gate.status === 'expired' ? <View style={styles.card} accessibilityRole="alert">
      <Text style={styles.title}>Your session has expired</Text>
      <Text style={styles.copy}>Sign in again to continue.</Text>
      <Pressable accessibilityRole="button" disabled={gate.retrying} onPress={switchAccount} style={[styles.button, gate.retrying && styles.disabled]}>{gate.retrying ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.buttonText}>Sign in again</Text>}</Pressable>
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas, paddingHorizontal: 24 },
  spinner: { marginTop: 28 },
  card: { width: '100%', maxWidth: 420, alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineStrong, borderRadius: 18, padding: 20, marginTop: 32 },
  title: { color: colors.ink, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  copy: { color: colors.ink3, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6 },
  button: { marginTop: 16, minWidth: 160, minHeight: 46, borderRadius: 14, backgroundColor: colors.brand, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.ink, fontWeight: '800' },
  disabled: { opacity: 0.6 },
  link: { color: colors.brand2, fontSize: 13, fontWeight: '700', marginTop: 16 },
});
