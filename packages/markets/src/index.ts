// Public entry: venue-agnostic types and the public Gate catalog adapters.
// Nothing here may read Broker credentials or sign requests. The Broker
// client lives in `@backspace/markets/server` (server-only).
export * from './types';
export * from './venue';
export {
  GATE_PAGE_LIMIT,
  GATE_PRICE_BATCH,
  GATE_PRICE_HISTORY_MAX_MS,
  GATE_PUBLIC_PREFIX,
  GateCatalogAdapter,
  GateEventContractsAdapter,
  GatePredictionAdapter,
  gateCatalogAdapter,
  parseTrades,
} from './adapters/gate';
export type {
  GateBookLevel,
  GateOrderBook,
  GateRawMarket,
  GateRawOutcome,
  GatePriceInterval,
  GatePricePoint,
  GateTokenLastPrice,
  GateTrade,
  GateTradesPage,
} from './adapters/gate';
