import type { SimpleDate } from '@backspace/api-client';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

/** Web's DatePicker offers the current year and the 121 before it (YEARS_TO_SHOW = 122). */
const YEARS_TO_SHOW = 122;

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function toDate(value: SimpleDate): Date {
  return new Date(value.year, value.month - 1, value.day);
}

/** Local calendar day of `date` with a 1-based month. Future days are clamped to today. */
function toSimpleDate(date: Date): SimpleDate {
  const day = date > startOfToday() ? startOfToday() : date;
  return { year: day.getFullYear(), month: day.getMonth() + 1, day: day.getDate() };
}

function format(value: SimpleDate): string {
  return toDate(value).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

type Props = {
  value: SimpleDate | null;
  onChange: (value: SimpleDate | null) => void;
  disabled?: boolean;
};

/**
 * Optional date of birth, like web onboarding: no minimum age, no future dates, earliest year 121 years
 * back. Uses the SDK 57 `@expo/ui` drop-in DateTimePicker (SwiftUI wheel inline on iOS, Material 3
 * dialog on Android). Not rendered on web, where that picker has no implementation.
 */
export function DateOfBirthField({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date | null>(null);

  if (Platform.OS === 'web') return null;

  const today = startOfToday();
  const minimumDate = new Date(today.getFullYear() - (YEARS_TO_SHOW - 1), 0, 1);
  // Neutral starting point for the wheel when nothing is picked yet; not an age rule.
  const initial = value ? toDate(value) : new Date(today.getFullYear() - 20, 0, 1);

  function openPicker() { setDraft(initial); setOpen(true); }
  function commit(date: Date) { onChange(toSimpleDate(date)); setOpen(false); }

  return <View>
    <Text style={styles.label} nativeID="onboarding-dob-label">Date of Birth</Text>
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabelledBy="onboarding-dob-label" accessibilityLabel={value ? `Date of Birth, ${format(value)}` : 'Date of Birth, not set'} accessibilityHint="Opens a date picker" disabled={disabled} onPress={openPicker} style={({ pressed }) => [styles.input, pressed && styles.pressed, disabled && styles.disabled]}>
        <Text style={value ? styles.value : styles.placeholder}>{value ? format(value) : 'Add your date of birth'}</Text>
      </Pressable>
      {value && !open ? <Pressable accessibilityRole="button" accessibilityLabel="Clear date of birth" disabled={disabled} hitSlop={8} onPress={() => onChange(null)} style={styles.clear}><Text style={styles.clearText}>Clear</Text></Pressable> : null}
    </View>

    {open && Platform.OS === 'android' ? <DateTimePicker
      accentColor={colors.brand}
      maximumDate={today}
      minimumDate={minimumDate}
      mode="date"
      onDismiss={() => setOpen(false)}
      onValueChange={(_event, date) => commit(date)}
      presentation="dialog"
      value={draft ?? initial}
    /> : null}

    {open && Platform.OS === 'ios' ? <View style={styles.sheet}>
      <DateTimePicker
        accentColor={colors.brand2}
        display="spinner"
        maximumDate={today}
        minimumDate={minimumDate}
        mode="date"
        onValueChange={(_event, date) => setDraft(date)}
        themeVariant="dark"
        value={draft ?? initial}
      />
      <View style={styles.sheetActions}>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setOpen(false)}><Text style={styles.cancel}>Cancel</Text></Pressable>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => commit(draft ?? initial)}><Text style={styles.done}>Done</Text></Pressable>
      </View>
    </View> : null}

    <Text style={styles.hint}>Optional.</Text>
  </View>;
}

const styles = StyleSheet.create({
  label: { color: colors.ink2, fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, height: 56, borderRadius: 16, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surface, paddingHorizontal: 16, justifyContent: 'center' },
  value: { color: colors.ink, fontSize: 16 },
  placeholder: { color: colors.ink3, fontSize: 16 },
  clear: { paddingHorizontal: 4 },
  clearText: { color: colors.ink3, fontSize: 14, fontWeight: '700' },
  sheet: { marginTop: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: colors.surface, paddingVertical: 8, paddingHorizontal: 12 },
  sheetActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, paddingVertical: 8 },
  cancel: { color: colors.ink3, fontSize: 15, fontWeight: '700' },
  done: { color: colors.brand2, fontSize: 15, fontWeight: '800' },
  hint: { color: colors.ink3, fontSize: 12, lineHeight: 17, marginTop: 7, marginBottom: 12 },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.6 },
});
