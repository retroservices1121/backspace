import { fetch } from 'expo/fetch';

const API = (process.env.EXPO_PUBLIC_BACKSPACE_API_URL ?? 'https://backspace.to/api').replace(/\/$/, '');

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

export async function authorizedJson<T>(path: string, getToken: () => Promise<string | null>, init?: RequestInit): Promise<T> {
  const token = await getToken();
  if (!token) throw new ApiError(401, 'Sign in to continue.');
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init?.headers },
  });
  const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
  if (!response.ok) throw new ApiError(response.status, body.message || body.error || 'Request failed.');
  return body as T;
}

export function getPortfolio(getToken: () => Promise<string | null>) {
  return authorizedJson<PortfolioSummary>('/native/markets/portfolio', getToken);
}
export function placeOrder(input: PlaceOrderInput, getToken: () => Promise<string | null>) {
  return authorizedJson<{ orderId: string; status: string }>('/native/markets/orders', getToken, { method: 'POST', body: JSON.stringify(input) });
}
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
