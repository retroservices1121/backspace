import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';
import { LogoMark } from './icons';
export function BrandHeader({ section }: { section?: string }) { return <View style={styles.root}><LogoMark size={32} /><Text style={styles.brand}>Backspace</Text>{section ? <><View style={styles.divider} /><Text style={styles.section}>{section}</Text></> : null}</View>; }
const styles = StyleSheet.create({ root: { height: 60, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }, brand: { color: colors.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.6 }, divider: { width: 1, height: 20, backgroundColor: colors.lineStrong, marginLeft: 2 }, section: { color: colors.ink2, fontSize: 15, fontWeight: '600' } });
