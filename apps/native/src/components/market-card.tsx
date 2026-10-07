import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cents, leadingOutcome, money, type EventGroup, type Market } from '@/lib/gate';
import { colors, radii } from '@/constants/theme';
import { ChevronRightIcon } from './icons';

export function MarketCard({ market }: { market: Market }) {
  const leader = leadingOutcome(market);
  return <Pressable onPress={() => router.push({ pathname: '/market/[id]', params: { id: market.id } })} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    <View style={styles.top}><MarketImage uri={market.imageUrl} /><View style={styles.copy}><Text style={styles.category}>{market.category}</Text><Text style={styles.question} numberOfLines={3}>{market.question}</Text></View></View>
    <View style={styles.outcome}><Text style={styles.outcomeName} numberOfLines={1}>{leader.label}</Text><Text style={styles.price}>{cents(leader.price)}</Text></View>
    <View style={styles.meta}><Text style={styles.metaText}>{market.volume24h ? `${money(market.volume24h)} 24h volume` : 'Live market'}</Text><View style={styles.open}><Text style={styles.openText}>Open</Text><ChevronRightIcon width={16} height={16} color={colors.brand2} /></View></View>
  </Pressable>;
}

export function EventCard({ event }: { event: EventGroup }) {
  return <View style={styles.card}><View style={styles.top}><MarketImage uri={event.imageUrl} /><View style={styles.copy}><View style={styles.eventPills}><Text style={styles.category}>{event.category}</Text><Text style={styles.count}>{event.markets.length} MARKETS</Text></View><Text style={styles.question} numberOfLines={3}>{event.title}</Text></View></View>
    <View style={styles.marketRows}>{event.markets.slice(0, 4).map((market) => { const leader = leadingOutcome(market); return <Pressable key={market.id} onPress={() => router.push({ pathname: '/market/[id]', params: { id: market.id } })} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}><Text style={styles.rowTitle} numberOfLines={2}>{market.question}</Text><View style={styles.rowPrice}><Text style={styles.price}>{cents(leader.price)}</Text><Text style={styles.rowLabel} numberOfLines={1}>{leader.label}</Text></View><ChevronRightIcon width={16} height={16} color={colors.brand2} /></Pressable>; })}</View>
    <Text style={styles.eventMeta}>{event.volume24h ? `${money(event.volume24h)} 24h volume` : 'Live event'} · Select a market</Text>
  </View>;
}

function MarketImage({ uri }: { uri: string | null }) { return <View style={styles.imageWrap}>{uri ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={180} /> : <View style={styles.fallback}><Text style={styles.fallbackText}>B</Text></View>}</View>; }
const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radii.lg, padding: 14, gap: 12 }, pressed: { borderColor: 'rgba(123,76,255,0.55)', transform: [{ scale: 0.992 }] }, top: { flexDirection: 'row', gap: 12 }, imageWrap: { width: 76, height: 76, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.surfaceRaised }, fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandSoft }, fallbackText: { color: colors.brand2, fontSize: 30, fontWeight: '900' }, copy: { flex: 1, gap: 5 }, category: { color: colors.brand2, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 }, question: { color: colors.ink, fontSize: 16, fontWeight: '700', lineHeight: 21, letterSpacing: -0.2 }, outcome: { backgroundColor: colors.canvasRaised, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, outcomeName: { color: colors.ink2, fontSize: 13, fontWeight: '600', flex: 1 }, price: { color: colors.green2, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] }, meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, metaText: { color: colors.ink3, fontSize: 11 }, open: { flexDirection: 'row', alignItems: 'center', gap: 2 }, openText: { color: colors.brand2, fontSize: 12, fontWeight: '700' }, eventPills: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, count: { color: colors.brand2, backgroundColor: colors.brandSoft, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden', fontSize: 9, fontWeight: '800' }, marketRows: { gap: 7 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.canvasRaised, borderRadius: 11, borderWidth: 1, borderColor: colors.line, padding: 11 }, rowPressed: { borderColor: colors.brand2 }, rowTitle: { flex: 1, color: colors.ink2, fontSize: 12.5, fontWeight: '600', lineHeight: 17 }, rowPrice: { alignItems: 'flex-end', width: 56 }, rowLabel: { color: colors.ink3, fontSize: 9, maxWidth: 56 }, eventMeta: { color: colors.ink3, fontSize: 11 },
});
