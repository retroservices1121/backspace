import { Redirect } from 'expo-router';
import { PortfolioScreen } from '@/features/markets/portfolio-screen';
import { FEATURE_MARKETS } from '@/lib/flags';

export default function PortfolioRoute() {
  return FEATURE_MARKETS ? <PortfolioScreen /> : <Redirect href="/" />;
}
