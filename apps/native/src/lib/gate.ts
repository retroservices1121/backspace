import { fetch } from 'expo/fetch';

import { createGateClient, type GateFetch, type GateProduct } from './gate-core';

export * from './gate-core';

export const GATE_API = process.env.EXPO_PUBLIC_GATE_API_URL ?? 'https://api.dexbuilder.com/api/v4/prediction';
export const GATE_WS = process.env.EXPO_PUBLIC_GATE_WS_URL ?? 'wss://broker.dexbuilder.com/ws/dex-builder/prediction';

// Event Contracts share the public schema under /api/v4/event_contracts.
const GATE_EC_API = /\/prediction\/?$/.test(GATE_API)
  ? GATE_API.replace(/\/prediction\/?$/, '/event_contracts')
  : 'https://api.dexbuilder.com/api/v4/event_contracts';
const GATE_API_BY_PRODUCT: Record<GateProduct, string> = { prediction: GATE_API, event_contracts: GATE_EC_API };

export const { listMarkets, getMarket, getMarketTrades, getOrderBook, getPriceHistory } =
  createGateClient(fetch as unknown as GateFetch, GATE_API_BY_PRODUCT);
