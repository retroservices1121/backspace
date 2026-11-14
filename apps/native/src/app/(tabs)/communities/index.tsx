import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandHeader } from '@/components/brand-header';
import { CommunitiesIcon } from '@/components/icons';
import { TabEmptyState } from '@/components/tab-empty-state';
import { colors } from '@/constants/theme';

export default function CommunitiesScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <BrandHeader section="Communities" />
      <TabEmptyState
        icon={<CommunitiesIcon color={colors.brand2} />}
        title="Your communities"
        subtitle="Communities you join will show up here."
      />
    </View>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.canvas } });
