import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wordmark } from '@/components/brand/wordmark';
import { colors } from '@/constants/theme';
import { useSession } from '@/auth/session';

/**
 * Entry screen for signed-out people. There is deliberately no close or back control: every other route
 * is protected, so there is nowhere a signed-out person can go from here. After the code is verified the
 * session changes, this route's guard turns off, and the auth gate (src/app/index.tsx) sends the person
 * to onboarding or Communities.
 */
export default function SignInScreen() {
  const session = useSession(); const insets = useSafeAreaInsets(); const [email, setEmail] = useState(''); const [code, setCode] = useState(''); const [sent, setSent] = useState(false); const [localError, setLocalError] = useState<string | null>(null);
  const busy = session.flow === 'sending' || session.flow === 'verifying';
  async function submit() {
    setLocalError(null);
    try {
      if (!sent) { if (!email.trim().includes('@')) throw new Error('Enter a valid email address.'); await session.sendEmailCode(email.trim()); setSent(true); }
      else { if (code.trim().length < 4) throw new Error('Enter the code from your email.'); await session.verifyEmailCode(email.trim(), code.trim()); }
    } catch (error) { setLocalError(error instanceof Error ? error.message : 'Sign-in failed.'); }
  }
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}><View style={styles.body}><View style={styles.heading} accessibilityRole="header"><Wordmark width={210} /><Text style={styles.title}>Sign in to Backspace</Text></View>{sent ? <Text style={styles.copy}>{`Enter the verification code sent to ${email}.`}</Text> : <View style={styles.copySpacer} />}{!session.configured ? <View style={styles.notice}><Text style={styles.noticeTitle}>Mobile sign-in needs one setup step</Text><Text style={styles.noticeCopy}>Add the new Backspace mobile client ID from the identity dashboard to the app environment.</Text></View> : <><TextInput autoCapitalize="none" autoCorrect={false} editable={!sent && !busy} keyboardType="email-address" onChangeText={setEmail} placeholder="Email address" placeholderTextColor={colors.ink3} style={styles.input} value={email} />{sent ? <TextInput autoFocus keyboardType="number-pad" maxLength={8} onChangeText={setCode} placeholder="Verification code" placeholderTextColor={colors.ink3} style={[styles.input, styles.code]} value={code} /> : null}<Pressable disabled={busy} onPress={submit} style={({ pressed }) => [styles.button, pressed && styles.pressed, busy && styles.disabled]}>{busy ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.buttonText}>{sent ? 'Verify and continue' : 'Continue with email'}</Text>}</Pressable>{sent ? <Pressable disabled={busy} onPress={() => { setSent(false); setCode(''); setLocalError(null); }}><Text style={styles.link}>Use a different email</Text></Pressable> : null}{localError || session.error ? <Text style={styles.error}>{localError || session.error}</Text> : null}</>}</View><Text style={styles.legal}>By continuing, you agree to the Backspace Terms and Privacy Policy.</Text></KeyboardAvoidingView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas, paddingHorizontal: 24 }, body: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 }, heading: { alignItems: 'center' }, title: { color: colors.ink, fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginTop: 22 }, copy: { color: colors.ink3, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 10, marginBottom: 25, maxWidth: 350 }, copySpacer: { height: 28 }, input: { width: '100%', height: 56, borderRadius: 16, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surface, color: colors.ink, fontSize: 16, paddingHorizontal: 16, marginBottom: 12 }, code: { fontSize: 22, textAlign: 'center', letterSpacing: 5 }, button: { width: '100%', minHeight: 54, borderRadius: 16, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: 2 }, buttonText: { color: colors.ink, fontSize: 15, fontWeight: '800' }, pressed: { opacity: 0.84 }, disabled: { opacity: 0.6 }, link: { color: colors.brand2, fontSize: 13, fontWeight: '700', marginTop: 18 }, error: { color: colors.pink2, fontSize: 13, textAlign: 'center', marginTop: 16 }, notice: { width: '100%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 18, padding: 18 }, noticeTitle: { color: colors.ink, fontWeight: '800', fontSize: 16 }, noticeCopy: { color: colors.ink3, fontSize: 13, lineHeight: 20, marginTop: 7 }, legal: { color: colors.ink3, fontSize: 10, textAlign: 'center', paddingVertical: 16 } });
