import { Image } from 'expo-image';
import { type ImagePickerAsset, launchImageLibraryAsync } from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { UserIcon } from '@/components/icons';
import { colors } from '@/constants/theme';
import { isAssetTooLarge } from '@/lib/media/avatar-upload';

type Props = {
  value: ImagePickerAsset | null;
  onChange: (asset: ImagePickerAsset | null) => void;
  disabled?: boolean;
};

/**
 * Optional profile photo from the photo library, with a preview and a way to remove it. With no photo,
 * onboarding saves one of the stock default avatars (same as web).
 */
export function AvatarPicker({ value, onChange, disabled }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  async function pick() {
    setError(null); setOpening(true);
    try {
      // The system photo picker needs no library permission; camera is not offered.
      const result = await launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
      const asset = result.canceled ? null : result.assets[0];
      if (!asset) return;
      if (isAssetTooLarge(asset)) { setError('That photo is larger than 10 MB. Choose a smaller one.'); return; }
      onChange(asset);
    } catch {
      setError('Could not open your photos. Try again.');
    } finally { setOpening(false); }
  }

  const busy = disabled || opening;
  return <View style={styles.row}>
    <Pressable accessibilityRole="button" accessibilityLabel={value ? 'Change profile photo' : 'Choose profile photo'} disabled={busy} onPress={pick} style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
      {value ? <Image accessibilityIgnoresInvertColors contentFit="cover" source={{ uri: value.uri }} style={styles.image} /> : <UserIcon color={colors.ink3} width={34} height={34} />}
    </Pressable>
    <View style={styles.side}>
      <Text style={styles.label}>Profile photo</Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" disabled={busy} onPress={pick} hitSlop={8}><Text style={[styles.action, busy && styles.disabled]}>{value ? 'Change photo' : 'Choose photo'}</Text></Pressable>
        {value ? <Pressable accessibilityRole="button" accessibilityLabel="Remove profile photo" disabled={busy} onPress={() => { setError(null); onChange(null); }} hitSlop={8}><Text style={[styles.remove, busy && styles.disabled]}>Remove</Text></Pressable> : null}
      </View>
      <Text style={error ? styles.error : styles.hint} accessibilityLiveRegion="polite">{error ?? (value ? 'Looking good.' : 'Optional. Skip it and we’ll pick a default avatar for you.')}</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 18 },
  avatar: { width: 84, height: 84, borderRadius: 42, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  side: { flex: 1 },
  label: { color: colors.ink2, fontSize: 13, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 18, marginTop: 8 },
  action: { color: colors.brand2, fontSize: 14, fontWeight: '800' },
  remove: { color: colors.ink3, fontSize: 14, fontWeight: '700' },
  hint: { color: colors.ink3, fontSize: 12, lineHeight: 17, marginTop: 6 },
  error: { color: colors.pink2, fontSize: 12, lineHeight: 17, marginTop: 6 },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.6 },
});
