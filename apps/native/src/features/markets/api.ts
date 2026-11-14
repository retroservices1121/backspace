import { apiClient } from '@/lib/api/client';

export { ApiError } from '@backspace/api-client';

export type PortfolioPosition = {
  positionId: string; eventId: string; tokenId: string; outcome: string; size: number;
  averagePrice: number; value: number; availableSize: number; lockedSize: number;
  claimableAmount: number; settlementStatus: string; won: boolean;
};
export type PortfolioSummary = {
  total: number; dailyPnl: number; positionValue: number; available: number; unclaimed: number;
  positions: PortfolioPosition[];
};
export type PlaceOrderInput = {
  tokenId: string; side: 'BUY' | 'SELL'; price?: string; size?: string; totalCost?: string;
  orderType?: string; orderMode?: string; clientOrderId: string;
};

export function getPortfolio() {
  return apiClient.request<PortfolioSummary>('/native/markets/portfolio');
}

export function placeOrder(input: PlaceOrderInput) {
  return apiClient.request<{ orderId: string; status: string }>('/native/markets/orders', { method: 'POST', body: input });
}
