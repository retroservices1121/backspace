import { Redirect } from 'expo-router';
import { MarketDetailScreen } from '@/features/markets/market-detail-screen';
import { FEATURE_MARKETS } from '@/lib/flags';

export default function MarketDetailRoute() {
  return FEATURE_MARKETS ? <MarketDetailScreen /> : <Redirect href="/" />;
}
