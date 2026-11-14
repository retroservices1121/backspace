import { Redirect } from 'expo-router';
import { MarketsScreen } from '@/features/markets/markets-screen';
import { FEATURE_MARKETS } from '@/lib/flags';

export default function MarketsRoute() {
  return FEATURE_MARKETS ? <MarketsScreen /> : <Redirect href="/" />;
}
