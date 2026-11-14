import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandHeader } from '@/components/brand-header';
import { MessagesIcon } from '@/components/icons';
import { TabEmptyState } from '@/components/tab-empty-state';
import { colors } from '@/constants/theme';

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <BrandHeader section="Messages" />
      <TabEmptyState
        icon={<MessagesIcon color={colors.brand2} />}
        title="No messages yet"
        subtitle="Conversations you start will appear here."
      />
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas } });
