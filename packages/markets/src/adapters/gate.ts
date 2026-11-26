import type { MarketVenue } from '../venue';
import type {
  GateProduct,
  ListMarketsArgs,
  ListMarketsResult,
  Quote,
  QuoteArgs,
  SubmitArgs,
  SubmitResult,
  VenueMarket,
  VenueMarketRef,
} from '../types';

// Public Gate DexBuilder catalog adapters. These only call public market
// data routes and never hold credentials. Private (Broker-signed) calls live
// in `@backspace/markets/server`, which must never reach a client bundle.

const DEFAULT_API_URL = 'https://api.dexbuilder.com';

/** Public REST prefix per Gate product. */
export const GATE_PUBLIC_PREFIX: Record<GateProduct, string> = {
  prediction: '/api/v4/prediction',
  event_contracts: '/api/v4/event_contracts',
};

/** Documented maximum `limit` for event, market, and trade lists (1–100). */
export const GATE_PAGE_LIMIT = 100;
/** Documented maximum token ids per batch price request. */
export const GATE_PRICE_BATCH = 100;
/** Documented maximum price-history range for one query. */
export const GATE_PRICE_HISTORY_MAX_MS = 14 * 24 * 60 * 60 * 1000;

// Upper bound on what a single listMarkets call will collect, and on the
// number of pages walked, so a misbehaving cursor cannot loop forever.
const MAX_COLLECT = 1000;
const MAX_MARKET_PAGES = 20;
const EVENT_LOOKUP_CONCURRENCY = 8; // parallel GET /events/{event_id} lookups

type Localized = string | Record<string, unknown> | null;

export type GateRawOutcome = {
  outcome?: Localized;
  token_id?: string;
  /** Not in the published schema. Read only as a defensive fallback. */
  clob_token_id?: string;
};

export type GateRawMarket = {
  accepting_orders?: boolean;
  active?: boolean;
  best_ask?: string | null;
  best_bid?: string | null;
  category?: string;
  closed?: boolean;
  condition_id?: string;
  description?: Localized;
  end_date?: number | null;
  end_time?: number | null;
  event_icon_url?: string;
  event_id?: string;
  event_title?: Localized;
  icon?: string;
  image?: string;
  last_trade_price?: string | null;
  liquidity?: string;
  market_id?: string;
  neg_risk?: boolean;
  outcomes?: GateRawOutcome[];
  question?: Localized;
  resolved_at?: number;
  resolution_source?: string;
  slug?: string;
  start_date?: number;
  start_time?: number;
  status?: string;
  tags?: unknown;
  tick_size?: string;
  title?: string;
  volume?: string;
  volume_24hr?: string;
  winning_outcome?: string;
};

type Page<T> = {
  items?: T[] | null;
  next_cursor?: string | null;
};

type GateEvent = {
  event_id?: string;
  title?: Localized;
  image?: string;
  icon?: string;
};

type GateTradeRow = {
  trade_id?: string;
  market_id?: string;
  condition_id?: string;
  token_id?: string;
  side?: string;
  price?: string;
  size?: string;
  timestamp?: number;
};

type GateTokenPrice = { token_id?: string; price?: string | null; timestamp?: number | null };

/** Normalized public trade. `timestamp` is Unix milliseconds. */
export type GateTrade = {
  tradeId: string;
  marketId: string | null;
  conditionId: string | null;
  tokenId: string | null;
  side: string;
  price: string;
  size: string;
  timestamp: number | null;
};

export type GateTradesPage = { trades: GateTrade[]; cursor: string | null };
export type GateBookLevel = { price: string; size: string };
export type GateOrderBook = { bids: GateBookLevel[]; asks: GateBookLevel[] };
/** Price-history point. `t` is Unix milliseconds, `p` a decimal string. */
export type GatePricePoint = { t: number; p: string };
export type GateTokenLastPrice = { price: string; timestamp: number | null };
export type GatePriceInterval = '5m' | '15m' | '1h' | '4h' | '1d';

/** Event titles/images resolved from `/events`, plus the ids already requested. */
interface GateEventCache {
  info: Map<string, { title: string | null; image?: string }>;
  looked: Set<string>;
}

/**
 * Public catalog adapter for one Gate DexBuilder product. Prediction Markets
 * and Event Contracts share the same public schema under different prefixes.
 */
export class GateCatalogAdapter implements MarketVenue {
  readonly id = 'GATE' as const;
  readonly product: GateProduct;

  private readonly apiUrl: string;

  constructor(opts: { apiUrl?: string; product?: GateProduct } = {}) {
    this.apiUrl = (opts.apiUrl || DEFAULT_API_URL).replace(/\/+$/, '');
    this.product = opts.product || 'prediction';
  }

  /**
   * Collect up to `args.limit` live markets, paging `/markets` with
   * `next_cursor` at no more than 100 rows per request.
   *
   * Each page is enriched (event titles/images, including titles looked up
   * from `/events`) and normalized BEFORE the search predicate and status
   * check run, so a row whose displayed question comes from its event title
   * is matched exactly as it will be shown. Only eligible (ACTIVE, matching)
   * markets count toward the limit.
   *
   * Cursor contract: each upstream request asks only for the rows still
   * needed (`min(100, remaining)`), and every row of every fetched page is
   * consumed — kept or filtered out — before its `next_cursor` is returned.
   * So the returned cursor never jumps past rows the caller has not seen.
   * Filtering only shortens a page; the loop then keeps paging.
   */
  async listMarkets(args: ListMarketsArgs): Promise<ListMarketsResult> {
    const target = clampCollect(args.limit);
    const search = args.search ? args.search.toLowerCase() : null;
    const noPrices = new Map<string, GateTokenLastPrice>();
    const events: GateEventCache = { info: new Map(), looked: new Set() };
    const kept: GateRawMarket[] = [];
    let cursor: string | null = args.cursor || null;
    let pages = 0;

    while (kept.length < target && pages < MAX_MARKET_PAGES) {
      const qs = new URLSearchParams({
        limit: String(Math.min(GATE_PAGE_LIMIT, target - kept.length)),
        active: 'true',
        closed: 'false',
      });
      if (cursor) qs.set('cursor', cursor);
      if (args.category) qs.set('tag_slug', args.category);

      const page = await this.fetchJson<Page<GateRawMarket>>(`/markets?${qs.toString()}`);
      pages += 1;
      const rows = (page.items || []).filter((row) => row.closed !== true);

      // Resolve missing event titles for this page (once per event id).
      const enrichedRows = await this.withEventInfo(rows, events);

      // No early break: stopping mid-page and then returning this page's
      // next_cursor would skip the unconsumed rows. If Gate ever returns more
      // rows than requested, we overshoot `target` rather than drop markets.
      for (const enriched of enrichedRows) {
        const market = mapMarket(enriched, this.product, noPrices);
        if (!market || market.status !== 'ACTIVE') continue;
        if (search && !matchesSearch(market, search)) continue;
        kept.push(enriched);
      }
      cursor = page.next_cursor || null;
      if (!cursor) break;
    }

    // Prices never change eligibility, so fetch them only for kept rows.
    const prices = await this.tokenPrices(kept.flatMap(outcomeTokenIds)).catch(
      () => new Map<string, GateTokenLastPrice>(),
    );
    const markets = kept
      .map((row) => mapMarket(row, this.product, prices))
      .filter((market): market is VenueMarket => market !== null);

    return { markets, cursor };
  }

  async getMarket(ref: VenueMarketRef): Promise<VenueMarket | null> {
    if (ref.venue !== this.id) return null;
    const detail = await this.getRawMarket(ref.externalId);
    if (!detail) return null;
    // Same event-title enrichment as listMarkets, so a market that is listed
    // (and searchable) via its event title also opens.
    const raw = (await this.withEventInfo([detail]))[0] || detail;
    const prices = await this.tokenPrices(outcomeTokenIds(raw)).catch(
      () => new Map<string, GateTokenLastPrice>(),
    );
    return mapMarket(raw, this.product, prices);
  }

  /** Public market trades, parsed from the documented `{ items, next_cursor }` page. */
  async listTrades(
    marketId: string,
    opts: { limit?: number; cursor?: string } = {},
  ): Promise<GateTradesPage> {
    const qs = new URLSearchParams({ limit: String(clampPage(opts.limit)) });
    if (opts.cursor) qs.set('cursor', opts.cursor);
    const page = await this.fetchJson<Page<GateTradeRow>>(
      `/markets/${encodeURIComponent(marketId)}/trades?${qs.toString()}`,
    );
    return { trades: parseTrades(page), cursor: (page && page.next_cursor) || null };
  }

  async getOrderBook(tokenId: string, depth = 20): Promise<GateOrderBook> {
    const raw = await this.fetchJson<{
      bids?: { price?: string; size?: string }[];
      asks?: { price?: string; size?: string }[];
    }>(`/tokens/${encodeURIComponent(tokenId)}/order_book?depth=${clampPage(depth)}`);
    return { bids: bookLevels(raw && raw.bids), asks: bookLevels(raw && raw.asks) };
  }

  /**
   * Token price history. `fromMs` / `toMs` are Unix milliseconds; the range
   * is clamped to the documented 14-day maximum.
   */
  async getPriceHistory(
    tokenId: string,
    opts: { interval?: GatePriceInterval; fromMs: number; toMs: number },
  ): Promise<GatePricePoint[]> {
    const toMs = Math.floor(opts.toMs);
    const fromMs = Math.max(Math.floor(opts.fromMs), toMs - GATE_PRICE_HISTORY_MAX_MS);
    const qs = new URLSearchParams({
      interval: opts.interval || '1h',
      from: String(fromMs),
      to: String(toMs),
    });
    const raw = await this.fetchJson<{ history?: { p?: string; t?: number }[] }>(
      `/tokens/${encodeURIComponent(tokenId)}/price_history?${qs.toString()}`,
    );
    return ((raw && raw.history) || []).flatMap((point) => {
      const p = validDecimal(point.p);
      const t = toMillis(point.t);
      return p !== null && t !== null ? [{ t, p }] : [];
    });
  }

  /**
   * Latest trade price per token via the batch `/tokens/prices` route
   * (≤100 ids per request). Tokens without a usable trade are omitted.
   */
  async tokenPrices(tokenIds: string[]): Promise<Map<string, GateTokenLastPrice>> {
    const unique = Array.from(new Set(tokenIds.filter(Boolean)));
    const result = new Map<string, GateTokenLastPrice>();
    for (let i = 0; i < unique.length; i += GATE_PRICE_BATCH) {
      const chunk = unique.slice(i, i + GATE_PRICE_BATCH);
      const ids = chunk.map((id) => encodeURIComponent(id)).join(',');
      const page = await this.fetchJson<{ items?: GateTokenPrice[] }>(`/tokens/prices?token_ids=${ids}`);
      for (const item of (page && page.items) || []) {
        const price = validDecimal(item.price);
        if (item.token_id && price !== null) {
          result.set(item.token_id, { price, timestamp: toMillis(item.timestamp) });
        }
      }
    }
    return result;
  }

  /** Raw market detail, preferring the richer slug route when available. */
  async getRawMarket(marketId: string): Promise<GateRawMarket | null> {
    const summary = await this.fetchJson<GateRawMarket | null>(
      `/markets/${encodeURIComponent(marketId)}`,
      { allow404: true },
    );
    if (!summary) return null;
    return summary.slug
      ? this.fetchJson<GateRawMarket>(`/markets/slug/${encodeURIComponent(summary.slug)}`).catch(() => summary)
      : summary;
  }

  async quote(_args: QuoteArgs): Promise<Quote> {
    throw new Error('Gate quotes are served by the Broker API on the Backspace server.');
  }

  async submit(_args: SubmitArgs): Promise<SubmitResult> {
    throw new Error('Gate orders are placed by the Broker API on the Backspace server.');
  }

  /**
   * Fill in `event_title` / `event_icon_url` from `/events` for rows that
   * have an `event_id` but no title of their own. Shared by listMarkets and
   * getMarket so both normalize a row identically. `cache` carries lookups
   * across catalog pages (each event id is requested at most once).
   */
  private async withEventInfo(
    rows: GateRawMarket[],
    cache: GateEventCache = { info: new Map(), looked: new Set() },
  ): Promise<GateRawMarket[]> {
    const missing = Array.from(new Set(rows.flatMap((row) =>
      row.event_id && !localizedText(row.event_title) && !cache.looked.has(row.event_id) ? [row.event_id] : [],
    )));
    if (missing.length > 0) {
      missing.forEach((id) => cache.looked.add(id));
      (await this.eventInfo(missing)).forEach((value, key) => cache.info.set(key, value));
    }
    return rows.map((row) => {
      const event = row.event_id ? cache.info.get(row.event_id) : undefined;
      return {
        ...row,
        event_title: localizedText(row.event_title) || (event ? event.title : null),
        event_icon_url: row.event_icon_url || (event ? event.image : undefined),
      };
    });
  }

  /**
   * Resolve titles and images for the given event ids via GET
   * `/events/{event_id}`. No active/closed filters: those belong to market
   * discovery only, and `/markets/{id}` can still return a market whose
   * parent event has closed. Event info is decorative, so a failed or missing
   * lookup leaves that event unresolved rather than dropping markets.
   */
  private async eventInfo(eventIds: string[]): Promise<Map<string, { title: string | null; image?: string }>> {
    const unique = Array.from(new Set(eventIds.filter(Boolean)));
    const info = new Map<string, { title: string | null; image?: string }>();
    for (let i = 0; i < unique.length; i += EVENT_LOOKUP_CONCURRENCY) {
      await Promise.all(unique.slice(i, i + EVENT_LOOKUP_CONCURRENCY).map(async (eventId) => {
        const event = await this.fetchJson<GateEvent | null>(
          `/events/${encodeURIComponent(eventId)}`,
          { allow404: true },
        ).catch(() => null);
        if (event) info.set(eventId, { title: localizedText(event.title), image: event.image || event.icon });
      }));
    }
    return info;
  }

  private async fetchJson<T>(path: string, opts: { allow404?: boolean } = {}): Promise<T> {
    const prefix = GATE_PUBLIC_PREFIX[this.product];
    const res = await fetch(`${this.apiUrl}${prefix}${path}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.status === 404 && opts.allow404) return null as unknown as T;
    if (!res.ok) {
      const routePath = path.split('?')[0];
      throw new Error(`Gate DexBuilder ${res.status} on ${prefix}${routePath}`);
    }
    return (await res.json()) as T;
  }
}

/** Public Prediction Markets adapter (`/api/v4/prediction`). */
export class GatePredictionAdapter extends GateCatalogAdapter {
  constructor(opts: { apiUrl?: string } = {}) {
    super({ apiUrl: opts.apiUrl, product: 'prediction' });
  }
}

/** Public Event Contracts adapter (`/api/v4/event_contracts`). */
export class GateEventContractsAdapter extends GateCatalogAdapter {
  constructor(opts: { apiUrl?: string } = {}) {
    super({ apiUrl: opts.apiUrl, product: 'event_contracts' });
  }
}

export function gateCatalogAdapter(product: GateProduct, apiUrl?: string): GateCatalogAdapter {
  return product === 'event_contracts'
    ? new GateEventContractsAdapter({ apiUrl })
    : new GatePredictionAdapter({ apiUrl });
}

/** Parse the documented public trades page. Bare arrays are tolerated defensively. */
export function parseTrades(page: Page<GateTradeRow> | GateTradeRow[] | null | undefined): GateTrade[] {
  const rows = Array.isArray(page) ? page : (page && page.items) || [];
  return rows.flatMap((row, index) => {
    const price = validDecimal(row.price);
    const size = validDecimal(row.size);
    if (price === null || size === null) return [];
    const timestamp = toMillis(row.timestamp);
    return [{
      tradeId: row.trade_id || `${timestamp || 0}-${row.token_id || ''}-${index}`,
      marketId: row.market_id || null,
      conditionId: row.condition_id || null,
      tokenId: row.token_id || null,
      side: (row.side || '').toUpperCase(),
      price,
      size,
      timestamp,
    }];
  });
}

function outcomeTokenIds(raw: GateRawMarket): string[] {
  return (raw.outcomes || []).flatMap((outcome) => {
    const id = outcome.token_id || outcome.clob_token_id;
    return id ? [id] : [];
  });
}

/**
 * Fill an outcome price. Order of preference:
 *  1. batch `/tokens/prices` latest trade price for that token;
 *  2. for the first outcome, the market-level BBO midpoint, then
 *     `last_trade_price` (Gate's market summary quotes the first token);
 *  3. for a binary market's second outcome, the complement of the first.
 */
function outcomePrices(
  raw: GateRawMarket,
  tokens: string[],
  prices: Map<string, GateTokenLastPrice>,
): Array<GateTokenLastPrice | null> {
  const filled: Array<GateTokenLastPrice | null> = tokens.map((token) => prices.get(token) || null);
  if (filled.length > 0 && !filled[0]) {
    const mid = midpoint(raw.best_bid, raw.best_ask);
    const fallback = mid !== null ? mid : validDecimal(raw.last_trade_price);
    if (fallback !== null) filled[0] = { price: fallback, timestamp: null };
  }
  const first = filled[0];
  if (filled.length === 2 && !filled[1] && first) {
    filled[1] = { price: trimDecimal(1 - Number(first.price)), timestamp: first.timestamp };
  }
  return filled;
}

function mapMarket(
  raw: GateRawMarket,
  product: GateProduct,
  prices: Map<string, GateTokenLastPrice>,
): VenueMarket | null {
  if (!raw.market_id) return null;
  const question = localizedText(raw.question) || raw.title || localizedText(raw.event_title);
  const closesAt = unixDate(raw.end_date != null ? raw.end_date : raw.end_time);
  if (!question || !closesAt) return null;

  const rows = (raw.outcomes || []).flatMap((outcome) => {
    const externalId = outcome.token_id || outcome.clob_token_id;
    const label = localizedText(outcome.outcome);
    return externalId && label ? [{ externalId, label }] : [];
  });
  if (rows.length === 0) return null;
  const filled = outcomePrices(raw, rows.map((row) => row.externalId), prices);
  const outcomes = rows.map((row, index) => {
    const price = filled[index] || null;
    return {
      externalId: row.externalId,
      label: row.label,
      lastPrice: price ? price.price : null,
      lastPriceAt: price ? (price.timestamp ? new Date(price.timestamp) : new Date()) : null,
    };
  });

  const status = marketStatus(raw, closesAt);
  return {
    venue: 'GATE',
    product,
    externalId: raw.market_id,
    eventId: raw.event_id || null,
    eventTitle: localizedText(raw.event_title),
    question,
    description: localizedText(raw.description) || '',
    category: raw.category || firstTag(raw.tags),
    imageUrl: raw.image || raw.icon || raw.event_icon_url || null,
    chain: null,
    contractAddress: raw.condition_id || null,
    negRisk: raw.neg_risk === true,
    status,
    opensAt: unixDate(raw.start_date != null ? raw.start_date : raw.start_time),
    closesAt,
    resolvedAt: unixDate(raw.resolved_at),
    slug: raw.slug || null,
    resolutionSource: raw.resolution_source || null,
    winningOutcome: raw.winning_outcome || null,
    acceptingOrders: status === 'ACTIVE' && raw.accepting_orders !== false,
    tickSize: validDecimal(raw.tick_size),
    bestBid: validDecimal(raw.best_bid),
    bestAsk: validDecimal(raw.best_ask),
    volumeUsd: positiveDecimal(raw.volume),
    volume24hUsd: positiveDecimal(raw.volume_24hr),
    liquidityUsd: positiveDecimal(raw.liquidity),
    outcomes,
  };
}

/**
 * Case-insensitive match on the displayed question, i.e. the normalized
 * `question`, which already falls back to `title` and then the event title.
 */
function matchesSearch(market: VenueMarket, search: string): boolean {
  return market.question.toLowerCase().includes(search);
}

function bookLevels(rows: { price?: string; size?: string }[] | undefined): GateBookLevel[] {
  return (rows || []).flatMap((row) => {
    const price = validDecimal(row.price);
    const size = validDecimal(row.size);
    return price !== null && size !== null ? [{ price, size }] : [];
  });
}

function localizedText(value: Localized | undefined): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  for (const key of ['en', 'en_US', 'en-US', 'default']) {
    if (typeof record[key] === 'string' && record[key]) return record[key] as string;
  }
  const first = Object.values(record).find((item) => typeof item === 'string' && item);
  return typeof first === 'string' ? first : null;
}

function unixDate(value: number | null | undefined): Date | null {
  const ms = toMillis(value);
  if (ms === null) return null;
  const date = new Date(ms);
  return Number.isFinite(date.getTime()) ? date : null;
}

/** Gate uses Unix seconds for most fields and milliseconds for some. */
function toMillis(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
  return value < 10000000000 ? value * 1000 : value;
}

function validDecimal(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? String(value) : null;
}

function positiveDecimal(value: string | null | undefined): string | null {
  const decimal = validDecimal(value);
  return decimal !== null && Number(decimal) > 0 ? decimal : null;
}

function midpoint(bid: string | null | undefined, ask: string | null | undefined): string | null {
  const b = validDecimal(bid);
  const a = validDecimal(ask);
  if (b === null || a === null) return null;
  const nb = Number(b);
  const na = Number(a);
  if (nb <= 0 || na <= 0 || na < nb) return null;
  return trimDecimal((nb + na) / 2);
}

function trimDecimal(value: number): string {
  return String(Math.round(value * 1e6) / 1e6);
}

function firstTag(tags: unknown): string | null {
  if (!Array.isArray(tags)) return null;
  for (const tag of tags) {
    if (typeof tag === 'string' && tag) return tag;
    if (tag && typeof tag === 'object') {
      const record = tag as Record<string, unknown>;
      const label = localizedText(record.label as Localized);
      if (label) return label;
      if (typeof record.slug === 'string') return record.slug;
    }
  }
  return null;
}

function marketStatus(raw: GateRawMarket, closesAt: Date): VenueMarket['status'] {
  const status = raw.status ? raw.status.toUpperCase() : undefined;
  if (status === 'INVALIDATED' || status === 'INVALID') return 'INVALIDATED';
  if (raw.closed || status === 'RESOLVED' || status === 'SETTLED') return 'RESOLVED';
  if (closesAt.getTime() <= Date.now()) return 'FROZEN';
  if (raw.active === false || raw.accepting_orders === false || status === 'FROZEN') return 'FROZEN';
  return 'ACTIVE';
}

function clampCollect(limit: number | undefined): number {
  if (!limit || !Number.isFinite(limit) || limit < 1) return 50;
  return Math.min(Math.floor(limit), MAX_COLLECT);
}

function clampPage(limit: number | undefined): number {
  if (!limit || !Number.isFinite(limit) || limit < 1) return 20;
  return Math.min(Math.floor(limit), GATE_PAGE_LIMIT);
}
