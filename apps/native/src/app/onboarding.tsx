import { completeOnboarding, runOnboardingFollowUps, type OnboardingFollowUp, type OnboardingFollowUpInput, type OnboardingFollowUpResult, type SimpleDate, type User } from '@backspace/api-client';
import { REJECTION_COPY, USERNAME_MAX_LENGTH, validateUsernameFormat } from '@backspace/usernames';
import { useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import type { ImagePickerAsset } from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthGate } from '@/auth/auth-gate';
import { useSession } from '@/auth/session';
import { Wordmark } from '@/components/brand/wordmark';
import { AvatarPicker } from '@/components/onboarding/avatar-picker';
import { DateOfBirthField } from '@/components/onboarding/date-of-birth-field';
import { colors } from '@/constants/theme';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { toAvatarUpload } from '@/lib/media/avatar-upload';

const DISPLAY_NAME_MAX_LENGTH = 50;

/** A created User row whose required follow-up writes (avatar, private details) have not all succeeded. */
interface PendingProfile {
  user: User;
  /** The identity and name sent with POST /user; reused as-is on retry. */
  base: Pick<OnboardingFollowUpInput, 'authId' | 'uuid' | 'displayName' | 'email'>;
  /** Outstanding writes, media first. */
  followUps: OnboardingFollowUp[];
}

/** Shows a one-button notice and resolves once it is dismissed (immediately on web, where Alert is a no-op). */
function notice(title: string, message: string): Promise<void> {
  if (Platform.OS === 'web') return Promise.resolve();
  return new Promise((resolve) => Alert.alert(title, message, [{ text: 'OK', onPress: () => resolve() }], { cancelable: true, onDismiss: () => resolve() }));
}

/**
 * First-run profile setup, mirroring apps/web/src/pages/auth/onboarding.tsx: profile photo (optional),
 * username, display name and date of birth (optional). Only reachable when the auth gate says
 * `needs-onboarding`; it has no tab bar and no back control.
 */
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets(); const session = useSession(); const gate = useAuthGate(); const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [photo, setPhoto] = useState<ImagePickerAsset | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<SimpleDate | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  /** Set once POST /user has succeeded but required follow-ups are outstanding. */
  const [pending, setPending] = useState<PendingProfile | null>(null);
  const busy = submitting || leaving;
  const mediaPending = !pending || pending.followUps.includes('media');
  const privatePending = !pending || pending.followUps.includes('private');

  /** Client-side rules from @backspace/usernames (format, length, reserved and trademarked handles). */
  function localUsernameError(value: string): string | null {
    const result = validateUsernameFormat(value);
    return result.ok ? null : REJECTION_COPY[result.reason];
  }

  /** Leaves onboarding. Only called once an avatar Media row exists. */
  async function finish(user: User) {
    // Seed `['me']` with the created profile (so a failed refetch cannot strand the person here and make
    // them resubmit a handle they already own), refetch it from the server, then go to Communities.
    queryClient.setQueryData(queryKeys.me, user);
    await queryClient.invalidateQueries({ queryKey: queryKeys.me });
    router.replace('/(tabs)/communities');
  }

  /**
   * Handles the outcome of the writes after POST /user. A missing avatar row, or unsaved private details
   * (name, email, date of birth), keeps the person here with the created user and the outstanding writes,
   * so "Try again" retries only those. A failed onboarded flag alone stays best effort.
   */
  async function settle(user: User, base: PendingProfile['base'], { photoUploadFailed, failedFollowUps }: OnboardingFollowUpResult) {
    // photoUploadFailed is only set once the default avatar row has actually been written.
    if (photoUploadFailed) await notice('Photo not uploaded', 'We couldn’t upload your photo, so your profile has a default avatar for now.');
    if (failedFollowUps.includes('media')) {
      setPending({ user, base, followUps: failedFollowUps });
      setSubmitError(`@${user.username} was created, but we couldn’t attach ${photo ? 'your photo or a default avatar' : 'a default avatar'}. Check your connection and try again.`);
      return;
    }
    if (failedFollowUps.includes('private')) {
      setPending({ user, base, followUps: failedFollowUps });
      setSubmitError(`We couldn’t save your private details${dateOfBirth ? ', including your date of birth' : ''}. Try again.`);
      return;
    }
    setPending(null);
    await finish(user);
  }

  async function submit() {
    setSubmitError(null);
    if (pending) {
      // POST /user already succeeded: never repeat it (the username and uuid are taken). Retry only the
      // outstanding writes, media first.
      setSubmitting(true);
      try {
        const result = await runOnboardingFollowUps(apiClient, { ...pending.base, avatar: photo ? toAvatarUpload(photo) : null, dateOfBirth }, pending.followUps);
        await settle(pending.user, pending.base, result);
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'Something went wrong. Try again.');
      } finally { setSubmitting(false); }
      return;
    }

    const handle = username.trim();
    const name = displayName.trim().replace(/\s+/g, ' ');
    const handleProblem = localUsernameError(handle);
    const nameProblem = !name ? 'Add a display name.' : name.length > DISPLAY_NAME_MAX_LENGTH ? `At most ${DISPLAY_NAME_MAX_LENGTH} characters.` : null;
    setUsernameError(handleProblem); setNameError(nameProblem);
    if (handleProblem || nameProblem || !session.user) return;

    setSubmitting(true);
    try {
      // POST /user, then the avatar Media row (picked photo, or a default one), then private details and
      // the onboarded flag (see completeOnboarding).
      const base = { authId: session.user.id, uuid: randomUUID(), displayName: name, email: session.user.email };
      const { user, ...result } = await completeOnboarding(apiClient, {
        ...base,
        username: handle,
        avatar: photo ? toAvatarUpload(photo) : null,
        dateOfBirth,
      });
      await settle(user, base, result);
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

      <AvatarPicker disabled={busy || !mediaPending} onChange={setPhoto} value={photo} />

      <Text style={styles.label} nativeID="onboarding-username-label">Username</Text>
      <View style={[styles.field, usernameError && styles.fieldInvalid]}>
        <Text style={styles.at}>@</Text>
        <TextInput accessibilityLabelledBy="onboarding-username-label" accessibilityLabel="Username" autoCapitalize="none" autoComplete="username-new" autoCorrect={false} editable={!busy && !pending} maxLength={USERNAME_MAX_LENGTH + 10} onChangeText={(value) => { setUsername(value); setUsernameError(null); }} placeholder="yourname" placeholderTextColor={colors.ink3} returnKeyType="next" style={styles.fieldInput} textContentType="username" value={username} />
      </View>
      <Text style={usernameError ? styles.fieldError : styles.hint} accessibilityLiveRegion="polite">{usernameError ?? '3–20 characters. Letters, numbers and single underscores; start with a letter.'}</Text>

      <Text style={styles.label} nativeID="onboarding-name-label">Display name</Text>
      <TextInput accessibilityLabelledBy="onboarding-name-label" accessibilityLabel="Display name" autoCapitalize="words" autoComplete="name" editable={!busy && !pending} maxLength={DISPLAY_NAME_MAX_LENGTH + 10} onChangeText={(value) => { setDisplayName(value); setNameError(null); }} onSubmitEditing={submit} placeholder="Your name" placeholderTextColor={colors.ink3} returnKeyType="done" style={[styles.input, nameError && styles.fieldInvalid]} textContentType="name" value={displayName} />
      {nameError ? <Text style={styles.fieldError} accessibilityLiveRegion="polite">{nameError}</Text> : <Text style={styles.hint}>How your name appears to others.</Text>}

      <DateOfBirthField disabled={busy || !privatePending} onChange={setDateOfBirth} value={dateOfBirth} />

      <Pressable accessibilityRole="button" disabled={busy} onPress={submit} style={({ pressed }) => [styles.button, pressed && styles.pressed, busy && styles.disabled]}>{submitting ? <ActivityIndicator color={colors.ink} /> : <Text style={styles.buttonText}>{pending ? 'Try again' : 'Create profile'}</Text>}</Pressable>
      {submitError ? <Text style={styles.error} accessibilityRole="alert">{submitError}</Text> : null}
      {pending && !mediaPending ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => { const { user } = pending; setPending(null); setSubmitError(null); void finish(user); }} style={styles.skip}><Text style={styles.link}>Continue without saving these details</Text></Pressable> : null}

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
  skip: { alignItems: 'center', marginTop: 12 },
  escape: { alignItems: 'center', marginTop: 28, paddingTop: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  signedInAs: { color: colors.ink3, fontSize: 12, marginBottom: 10, textAlign: 'center' },
  link: { color: colors.ink2, fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
});
