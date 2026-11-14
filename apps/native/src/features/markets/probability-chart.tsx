import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors } from '@/constants/theme';
import type { PricePoint } from '@/lib/gate';

export function ProbabilityChart({ points, width = 330, height = 190 }: { points: PricePoint[]; width?: number; height?: number }) {
  const path = useMemo(() => createPath(points, width, height), [height, points, width]);
  if (points.length < 2) return <View style={[styles.empty, { height }]}><Text style={styles.emptyText}>Price history will appear when Gate reports enough trades.</Text></View>;
  const latest = points[points.length - 1].price;
  return <View><View style={styles.heading}><Text style={styles.label}>LIVE PROBABILITY</Text><Text style={styles.value}>{Math.round(latest * 100)}%</Text></View><Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}><Defs><LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={colors.brand2} stopOpacity="0.34" /><Stop offset="1" stopColor={colors.brand2} stopOpacity="0" /></LinearGradient></Defs><Path d={`${path} L ${width - 8} ${height - 10} L 8 ${height - 10} Z`} fill="url(#fill)" /><Path d={path} fill="none" stroke={colors.brand2} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></Svg></View>;
}
function createPath(points: PricePoint[], width: number, height: number) { const values = points.slice(-120); const min = Math.min(...values.map((p) => p.price)); const max = Math.max(...values.map((p) => p.price)); const range = Math.max(max - min, 0.05); return values.map((point, index) => { const x = 8 + (index / Math.max(values.length - 1, 1)) * (width - 16); const y = 10 + ((max - point.price) / range) * (height - 28); return `${index ? 'L' : 'M'} ${x.toFixed(2)} ${y.toFixed(2)}`; }).join(' '); }
const styles = StyleSheet.create({ heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 4 }, label: { color: colors.ink3, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }, value: { color: colors.ink, fontSize: 23, fontWeight: '800' }, empty: { alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.canvasRaised, padding: 24 }, emptyText: { color: colors.ink3, fontSize: 13, textAlign: 'center', lineHeight: 19 } });
