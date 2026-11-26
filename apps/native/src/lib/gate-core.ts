// Pure Gate public-catalog client for native. No Expo or React Native
// imports: `gate.ts` binds it to `expo/fetch`, and the Node test build binds
// it to a mocked fetch (see apps/native/test/gate-core.test.cjs).

/** Gate public product. Prediction Markets is the default everywhere. */
export type GateProduct = 'prediction' | 'event_contracts';
export const GATE_PRODUCTS: { key: GateProduct; label: string }[] = [
  { key: 'prediction', label: 'Prediction' },
  { key: 'event_contracts', label: 'Event Contracts' },
];
export function parseProduct(value: unknown): GateProduct { return (Array.isArray(value) ? value[0] : value) === 'event_contracts' ? 'event_contracts' : 'prediction'; }

type Localized = string | Record<string, unknown> | null;
// Published OutcomeRef is { outcome, token_id }. clob_token_id is a defensive fallback only.
export type GateOutcome = { outcome?: Localized; token_id?: string; clob_token_id?: string };
export type GateMarket = {
  accepting_orders?: boolean; active?: boolean; best_ask?: string | null; best_bid?: string | null; category?: string; closed?: boolean;
  condition_id?: string; description?: Localized; end_date?: number; end_time?: number; event_icon_url?: string; event_id?: string;
  event_title?: Localized; icon?: string; image?: string; last_trade_price?: string | null; liquidity?: string; market_id?: string;
  outcomes?: GateOutcome[]; question?: Localized; resolution_source?: string; slug?: string; status?: string; tags?: unknown;
  title?: string; volume?: string; volume_24hr?: string;
};
type GateEvent = { event_id?: string; title?: Localized };
type Page<T> = { items?: T[] | null; next_cursor?: string | null };

export type Outcome = { id: string; label: string; price: number | null };
export type Market = {
  id: string; eventId: string | null; eventTitle: string | null; conditionId: string | null; question: string; description: string;
  category: string; imageUrl: string | null; closesAt: Date | null; volume: number; volume24h: number; liquidity: number;
  bestBid: number | null; bestAsk: number | null; acceptingOrders: boolean; outcomes: Outcome[]; product: GateProduct;
};
export type EventGroup = { id: string; title: string; category: string; imageUrl: string | null; markets: Market[]; volume24h: number };
export type Trade = { id: string; outcome: string; side: string; price: number; size: number; timestamp: number };
export type BookLevel = { price: number; size: number };
export type PricePoint = { price: number; timestamp: number };

/** The subset of fetch the client uses, satisfied by both `expo/fetch` and Node's global fetch. */
export type GateFetch = (url: string, init: { headers: Record<string, string> }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

const PAGE_LIMIT = 100; // documented Gate list maximum (1–100)
const PRICE_BATCH = 100; // documented /tokens/prices maximum
const MAX_PAGES = 10;
const DEFAULT_MARKETS = 200;
const EVENT_CONCURRENCY = 8; // parallel GET /events/{event_id} title lookups

export function createGateClient(fetchImpl: GateFetch, bases: Record<GateProduct, string>) {
  async function getJson<T>(path: string, product: GateProduct = 'prediction'): Promise<T> {
    const response = await fetchImpl(`${bases[product]}${path}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Gate returned ${response.status}`);
    return response.json() as Promise<T>;
  }

  /** Page a Gate list route with next_cursor until `target` rows or the cursor ends. */
  async function collect<T>(path: string, target: number, product: GateProduct, until?: (rows: T[]) => boolean): Promise<T[]> {
    const rows: T[] = []; let cursor: string | null = null;
    for (let page = 0; page < MAX_PAGES && rows.length < target; page += 1) {
      const separator = path.includes('?') ? '&' : '?';
      const body: Page<T> = await getJson<Page<T>>(`${path}${separator}limit=${Math.min(PAGE_LIMIT, target - rows.length)}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, product);
      rows.push(...(body.items ?? []));
      cursor = body.next_cursor || null;
      if (!cursor || until?.(rows)) break;
    }
    return rows.slice(0, target);
  }

  /** Latest trade price per token via batch /tokens/prices (≤100 ids per call). */
  async function tokenPrices(tokenIds: string[], product: GateProduct): Promise<Map<string, number>> {
    const unique = [...new Set(tokenIds.filter(Boolean))]; const prices = new Map<string, number>();
    for (let index = 0; index < unique.length; index += PRICE_BATCH) {
      const ids = unique.slice(index, index + PRICE_BATCH).map(encodeURIComponent).join(',');
      const body = await getJson<{ items?: { token_id?: string; price?: string | null }[] }>(`/tokens/prices?token_ids=${ids}`, product);
      for (const item of body.items ?? []) { const price = number(item.price); if (item.token_id && price !== null && item.price !== '') prices.set(item.token_id, price); }
    }
    return prices;
  }

  /**
   * Titles for rows that have an `event_id` but no title of their own,
   * looked up one event at a time via GET `/events/{event_id}`. Shared by
   * list and detail so a market whose only displayable question is its event
   * title both lists and opens. No active/closed filters: those belong to
   * market discovery only, and a market can still be served after its parent
   * event closes. Decorative lookups: a failure leaves that title unresolved
   * rather than dropping markets.
   */
  async function eventTitles(raws: GateMarket[], product: GateProduct): Promise<Map<string, string>> {
    const missing = [...new Set(raws.flatMap((raw) => raw.event_id && !text(raw.event_title) ? [raw.event_id] : []))];
    const titles = new Map<string, string>();
    for (let index = 0; index < missing.length; index += EVENT_CONCURRENCY) {
      await Promise.all(missing.slice(index, index + EVENT_CONCURRENCY).map(async (eventId) => {
        const event = await getJson<GateEvent>(`/events/${encodeURIComponent(eventId)}`, product).catch(() => null);
        const title = text(event?.title);
        if (title) titles.set(eventId, title);
      }));
    }
    return titles;
  }

  async function listMarkets(limit = DEFAULT_MARKETS, product: GateProduct = 'prediction'): Promise<Market[]> {
    const raws = await collect<GateMarket>('/markets?active=true&closed=false', limit, product);
    const [titles, prices] = await Promise.all([
      eventTitles(raws, product),
      tokenPrices(raws.flatMap(tokenIdsOf), product).catch(() => new Map<string, number>()),
    ]);
    return raws.map((raw) => normalizeMarket(raw, titles, prices, product)).filter((value): value is Market => value !== null);
  }

  async function getMarket(id: string, product: GateProduct = 'prediction'): Promise<Market> {
    const raw = await getJson<GateMarket>(`/markets/${encodeURIComponent(id)}`, product);
    const [titles, prices] = await Promise.all([
      eventTitles([raw], product),
      tokenPrices(tokenIdsOf(raw), product).catch(() => new Map<string, number>()),
    ]);
    const market = normalizeMarket(raw, titles, prices, product);
    if (!market) throw new Error('Market data is incomplete');
    return market;
  }

  /** Public trades: documented page `{ items, next_cursor }`, `trade_id`, `timestamp` in ms. */
  async function getMarketTrades(id: string, outcomes: Outcome[] = [], product: GateProduct = 'prediction'): Promise<Trade[]> {
    const page = await getJson<Page<Record<string, unknown>>>(`/markets/${encodeURIComponent(id)}/trades?limit=30`, product);
    const labels = new Map(outcomes.map((outcome) => [outcome.id, outcome.label]));
    return (page.items ?? []).flatMap((row, index) => {
      const price = number(row.price); const size = number(row.size); const timestamp = number(row.timestamp);
      if (price === null || size === null) return [];
      const tokenId = String(row.token_id ?? '');
      return [{ id: String(row.trade_id ?? `${timestamp}-${tokenId}-${index}`), outcome: labels.get(tokenId) ?? '', side: String(row.side ?? ''), price, size, timestamp: timestamp ?? Date.now() }];
    });
  }

  async function getOrderBook(tokenId: string, product: GateProduct = 'prediction'): Promise<{ bids: BookLevel[]; asks: BookLevel[] }> {
    const raw = await getJson<{ bids?: {price?: string; size?: string}[]; asks?: {price?: string; size?: string}[] }>(`/tokens/${encodeURIComponent(tokenId)}/order_book?depth=20`, product);
    const map = (rows: {price?: string; size?: string}[] = []) => rows.flatMap((row) => {
      const price = number(row.price); const size = number(row.size); return price === null || size === null ? [] : [{ price, size }];
    });
    return { bids: map(raw.bids), asks: map(raw.asks) };
  }

  /** Price history: `from` / `to` and point `t` are Unix milliseconds; max range 14 days. */
  async function getPriceHistory(tokenId: string, product: GateProduct = 'prediction'): Promise<PricePoint[]> {
    const to = Date.now(); const from = to - 7 * 86_400_000;
    const raw = await getJson<{ history?: {p?: string; t?: number}[] }>(`/tokens/${encodeURIComponent(tokenId)}/price_history?interval=1h&from=${from}&to=${to}`, product);
    return (raw.history ?? []).flatMap((point) => { const price = number(point.p); return price === null || !point.t ? [] : [{ price, timestamp: point.t < 10_000_000_000 ? point.t * 1000 : point.t }]; });
  }

  return { listMarkets, getMarket, getMarketTrades, getOrderBook, getPriceHistory };
}

export function groupMarkets(markets: Market[]): EventGroup[] {
  const groups = new Map<string, EventGroup>();
  for (const market of markets) {
    const id = market.eventId ?? market.id;
    const existing = groups.get(id);
    if (existing) { existing.markets.push(market); existing.volume24h += market.volume24h; continue; }
    groups.set(id, { id, title: market.eventTitle || market.question, category: market.category, imageUrl: market.imageUrl, markets: [market], volume24h: market.volume24h });
  }
  return [...groups.values()].sort((a, b) => b.volume24h - a.volume24h);
}

function tokenIdsOf(raw: GateMarket): string[] {
  return (raw.outcomes ?? []).flatMap((outcome) => { const id = outcome.token_id || outcome.clob_token_id; return id ? [id] : []; });
}

// Outcome prices: batch /tokens/prices first. Gate's market summary quotes
// the first outcome token, so the first outcome falls back to the BBO
// midpoint or last trade, and a binary market's second outcome to 1 - first.
function outcomePrices(raw: GateMarket, ids: string[], prices: Map<string, number>): (number | null)[] {
  const filled = ids.map((id) => prices.get(id) ?? null);
  if (filled.length && filled[0] === null) {
    const bid = number(raw.best_bid); const ask = number(raw.best_ask);
    filled[0] = bid !== null && ask !== null && bid > 0 && ask >= bid ? (bid + ask) / 2 : number(raw.last_trade_price);
  }
  if (filled.length === 2 && filled[1] === null && filled[0] !== null) filled[1] = Math.round((1 - filled[0]) * 1e6) / 1e6;
  return filled;
}

/**
 * Same question order as the packages/markets adapter: question, then
 * title, then the event title (inline `event_title`, else the one fetched
 * from `/events`).
 */
export function normalizeMarket(raw: GateMarket, eventTitles: Map<string, string>, prices: Map<string, number>, product: GateProduct): Market | null {
  const eventTitle = text(raw.event_title) || (raw.event_id ? eventTitles.get(raw.event_id) ?? '' : '');
  const id = raw.market_id; const question = text(raw.question) || raw.title?.trim() || eventTitle;
  if (!id || !question) return null;
  const rows = (raw.outcomes ?? []).flatMap((outcome) => {
    const outcomeId = outcome.token_id || outcome.clob_token_id; const label = text(outcome.outcome);
    return outcomeId && label ? [{ id: outcomeId, label }] : [];
  });
  if (!rows.length) return null;
  const filled = outcomePrices(raw, rows.map((row) => row.id), prices);
  const outcomes = rows.map((row, index) => ({ ...row, price: filled[index] ?? null }));
  return { id, eventId: raw.event_id ?? null, eventTitle: eventTitle || null, conditionId: raw.condition_id ?? null, question, description: text(raw.description), category: raw.category || firstTag(raw.tags) || 'Markets', imageUrl: raw.image || raw.icon || raw.event_icon_url || null, closesAt: date(raw.end_date ?? raw.end_time), volume: number(raw.volume) ?? 0, volume24h: number(raw.volume_24hr) ?? 0, liquidity: number(raw.liquidity) ?? 0, bestBid: number(raw.best_bid), bestAsk: number(raw.best_ask), acceptingOrders: raw.accepting_orders !== false && !raw.closed, outcomes, product };
}

export function text(value: Localized | undefined): string {
  if (typeof value === 'string') return value.trim(); if (!value || typeof value !== 'object') return '';
  for (const key of ['en', 'en_US', 'en-US', 'default']) { const item = value[key]; if (typeof item === 'string' && item.trim()) return item.trim(); }
  const first = Object.values(value).find((item) => typeof item === 'string'); return typeof first === 'string' ? first : '';
}
function number(value: unknown): number | null { if (value === null || value === undefined || value === '') return null; const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
function date(value?: number): Date | null { if (!value) return null; const result = new Date(value < 10_000_000_000 ? value * 1000 : value); return Number.isFinite(result.getTime()) ? result : null; }
function firstTag(tags: unknown): string { if (!Array.isArray(tags)) return ''; for (const tag of tags) { if (typeof tag === 'string') return tag; if (tag && typeof tag === 'object') { const record = tag as Record<string, unknown>; const label = text(record.label as Localized); if (label) return label; if (typeof record.slug === 'string') return record.slug; } } return ''; }

export function money(value: number): string { return value >= 1_000_000 ? `$${(value / 1_000_000).toFixed(1)}M` : value >= 1_000 ? `$${(value / 1_000).toFixed(0)}K` : `$${Math.round(value)}`; }
export function cents(value: number | null): string { return value === null ? '—' : `${Math.round(value * 100)}¢`; }
export function leadingOutcome(market: Market): Outcome { return [...market.outcomes].sort((a, b) => (b.price ?? -1) - (a.price ?? -1))[0]; }
