import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSession } from '@/auth/session';
import { colors } from '@/constants/theme';

/**
 * Entry route: signed-in users land on Communities; everyone else goes to sign-in.
 * When sign-in is not configured (`configured === false`), the sign-in screen shows its setup notice.
 */
export default function Index() {
  const session = useSession();
  if (!session.ready) return <View style={styles.loading}><ActivityIndicator color={colors.brand2} /></View>;
  return <Redirect href={session.user ? '/(tabs)/communities' : '/sign-in'} />;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas } });
