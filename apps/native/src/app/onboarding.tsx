import { completeOnboarding } from '@backspace/api-client';
import { REJECTION_COPY, USERNAME_MAX_LENGTH, validateUsernameFormat } from '@backspace/usernames';
import { useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthGate } from '@/auth/auth-gate';
import { useSession } from '@/auth/session';
import { Wordmark } from '@/components/brand/wordmark';
import { colors } from '@/constants/theme';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';

const DISPLAY_NAME_MAX_LENGTH = 50;

/**
 * First-run profile setup, mirroring apps/web/src/pages/auth/onboarding.tsx with a minimal form
 * (username + display name; no avatar or date of birth yet). Only reachable when the auth gate says
 * `needs-onboarding`; it has no tab bar and no back control.
 */
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets(); const session = useSession(); const gate = useAuthGate(); const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const busy = submitting || leaving;

  /** Client-side rules from @backspace/usernames (format, length, reserved and trademarked handles). */
  function localUsernameError(value: string): string | null {
    const result = validateUsernameFormat(value);
    return result.ok ? null : REJECTION_COPY[result.reason];
  }

  async function submit() {
    setSubmitError(null);
    const handle = username.trim();
    const name = displayName.trim().replace(/\s+/g, ' ');
    const handleProblem = localUsernameError(handle);
    const nameProblem = !name ? 'Add a display name.' : name.length > DISPLAY_NAME_MAX_LENGTH ? `At most ${DISPLAY_NAME_MAX_LENGTH} characters.` : null;
    setUsernameError(handleProblem); setNameError(nameProblem);
    if (handleProblem || nameProblem || !session.user) return;

    setSubmitting(true);
    try {
      // Private details and the onboarded flag are best effort once the User row exists (see completeOnboarding).
      const { user } = await completeOnboarding(apiClient, { authId: session.user.id, username: handle, displayName: name, uuid: randomUUID(), email: session.user.email });
      // The profile exists now. Seed `['me']` with it (so a failed refetch cannot strand the person here and
      // make them resubmit a handle they already own), refetch it from the server, then go to Communities.
      queryClient.setQueryData(queryKeys.me, user);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      router.replace('/(tabs)/communities');
    } catch (error) {
      // Show the server's message as-is (ApiError carries it); no per-code rewriting.
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong. Try again.');
    } finally { setSubmitting(false); }
  }

  async function switchAccount() {
    setLeaving(true); setSubmitError(null);
    try { await gate.signOut(); router.replace('/sign-in'); }
    catch (error) { setSubmitError(error instanceof Error ? error.message : 'Could not sign out.'); }
    finally { setLeaving(false); }
  }

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
    <ScrollView contentContainerStyle={[styles.body, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
      <Wordmark width={150} />
      <Text style={styles.title} accessibilityRole="header">Finish setting up</Text>
      <Text style={styles.copy}>Claim your handle and a few basics. You can refine the rest from settings later.</Text>

      <Text style={styles.label} nativeID="onboarding-username-label">Username</Text>
      <View style={[styles.field, usernameError && styles.fieldInvalid]}>
        <Text style={styles.at}>@</Text>
        <TextInput accessibilityLabelledBy="onboarding-username-label" accessibilityLabel="Username" autoCapitalize="none" autoComplete="username-new" autoCorrect={false} editable={!busy} maxLength={USERNAME_MAX_LENGTH + 10} onChangeText={(value) => { setUsername(value); setUsernameError(null); }} placeholder="yourname" placeholderTextColor={colors.ink3} returnKeyType="next" style={styles.fieldInput} textContentType="username" value={username} />
      </View>
      <Text style={usernameError ? styles.fieldError : styles.hint} accessibilityLiveRegion="polite">{usernameError ?? '3–20 characters. Letters, numbers and single underscores; start with a letter.'}</Text>

      <Text style={styles.label} nativeID="onboarding-name-label">Display name</Text>
      <TextInput accessibilityLabelledBy="onboarding-name-label" accessibilityLabel="Display name" autoCapitalize="words" autoComplete="name" editable={!busy} maxLength={DISPLAY_NAME_MAX_LENGTH + 10} onChangeText={(value) => { setDisplayName(value); setNameError(null); }} onSubmitEditing={submit} placeholder="Your name" placeholderTextColor={colors.ink3} returnKeyType="done" style={[styles.input, nameError && styles.fieldInvalid]} textContentType="name" value={displayName} />
      {nameError ? <Text style={styles.fieldError} accessibilityLiveRegion="polite">{nameError}</Text> : <Text style={styles.hint}>How your name appears to others.</Text>}

      <Pressable accessibilityRole="button" disabled={busy} onPress={submit} style={({ pressed }) => [styles.button, pressed && styles.pressed, busy && styles.disabled]}>{submitting ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.buttonText}>Create profile</Text>}</Pressable>
      {submitError ? <Text style={styles.error} accessibilityRole="alert">{submitError}</Text> : null}

      <View style={styles.escape}>
        {session.user?.email ? <Text style={styles.signedInAs}>Signed in as {session.user.email}</Text> : null}
        <Pressable accessibilityRole="button" disabled={busy} onPress={switchAccount}>{leaving ? <ActivityIndicator color={colors.ink2} /> : <Text style={styles.link}>Use a different account</Text>}</Pressable>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  body: { flexGrow: 1, paddingHorizontal: 24, width: '100%', maxWidth: 480, alignSelf: 'center' },
  title: { color: colors.ink, fontSize: 26, fontWeight: '900', letterSpacing: -0.6, marginTop: 28 },
  copy: { color: colors.ink3, fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 22 },
  label: { color: colors.ink2, fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 6 },
  field: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 16, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surface, paddingHorizontal: 16 },
  at: { color: colors.ink3, fontSize: 16, marginRight: 2 },
  fieldInput: { flex: 1, height: '100%', color: colors.ink, fontSize: 16 },
  input: { height: 56, borderRadius: 16, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surface, color: colors.ink, fontSize: 16, paddingHorizontal: 16 },
  fieldInvalid: { borderColor: colors.pink2 },
  hint: { color: colors.ink3, fontSize: 12, lineHeight: 17, marginTop: 7, marginBottom: 12 },
  fieldError: { color: colors.pink2, fontSize: 12, lineHeight: 17, marginTop: 7, marginBottom: 12 },
  button: { minHeight: 54, borderRadius: 16, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  buttonText: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.6 },
  error: { color: colors.pink2, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 16 },
  escape: { alignItems: 'center', marginTop: 28, paddingTop: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  signedInAs: { color: colors.ink3, fontSize: 12, marginBottom: 10, textAlign: 'center' },
  link: { color: colors.ink2, fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
});
