import { fetch } from 'expo/fetch';

export const GATE_API = process.env.EXPO_PUBLIC_GATE_API_URL ?? 'https://api.dexbuilder.com/api/v4/prediction';
export const GATE_WS = process.env.EXPO_PUBLIC_GATE_WS_URL ?? 'wss://broker.dexbuilder.com/ws/dex-builder/prediction';

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
  bestBid: number | null; bestAsk: number | null; acceptingOrders: boolean; outcomes: Outcome[];
};
export type EventGroup = { id: string; title: string; category: string; imageUrl: string | null; markets: Market[]; volume24h: number };
export type Trade = { id: string; outcome: string; side: string; price: number; size: number; timestamp: number };
export type BookLevel = { price: number; size: number };
export type PricePoint = { price: number; timestamp: number };

const PAGE_LIMIT = 100; // documented Gate list maximum (1–100)
const PRICE_BATCH = 100; // documented /tokens/prices maximum
const MAX_PAGES = 10;
const DEFAULT_MARKETS = 200;

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${GATE_API}${path}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Gate returned ${response.status}`);
  return response.json() as Promise<T>;
}

/** Page a Gate list route with next_cursor until `target` rows or the cursor ends. */
async function collect<T>(path: string, target: number, until?: (rows: T[]) => boolean): Promise<T[]> {
  const rows: T[] = []; let cursor: string | null = null;
  for (let page = 0; page < MAX_PAGES && rows.length < target; page += 1) {
    const separator = path.includes('?') ? '&' : '?';
    const body: Page<T> = await getJson<Page<T>>(`${path}${separator}limit=${PAGE_LIMIT}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
    rows.push(...(body.items ?? []));
    cursor = body.next_cursor || null;
    if (!cursor || until?.(rows)) break;
  }
  return rows.slice(0, target);
}

/** Latest trade price per token via batch /tokens/prices (≤100 ids per call). */
async function tokenPrices(tokenIds: string[]): Promise<Map<string, number>> {
  const unique = [...new Set(tokenIds.filter(Boolean))]; const prices = new Map<string, number>();
  for (let index = 0; index < unique.length; index += PRICE_BATCH) {
    const ids = unique.slice(index, index + PRICE_BATCH).map(encodeURIComponent).join(',');
    const body = await getJson<{ items?: { token_id?: string; price?: string | null }[] }>(`/tokens/prices?token_ids=${ids}`);
    for (const item of body.items ?? []) { const price = number(item.price); if (item.token_id && price !== null && item.price !== '') prices.set(item.token_id, price); }
  }
  return prices;
}

export async function listMarkets(limit = DEFAULT_MARKETS): Promise<Market[]> {
  const raws = await collect<GateMarket>('/markets?active=true&closed=false', limit);
  const missing = new Set(raws.flatMap((raw) => raw.event_id && !text(raw.event_title) ? [raw.event_id] : []));
  const [events, prices] = await Promise.all([
    missing.size ? collect<GateEvent>('/events?active=true&closed=false', PAGE_LIMIT * MAX_PAGES, (rows) => rows.filter((event) => event.event_id && missing.has(event.event_id)).length >= missing.size).catch(() => [] as GateEvent[]) : Promise.resolve([] as GateEvent[]),
    tokenPrices(raws.flatMap(tokenIdsOf)).catch(() => new Map<string, number>()),
  ]);
  const titles = new Map(events.flatMap((event) => event.event_id ? [[event.event_id, text(event.title)] as const] : []));
  return raws.map((raw) => normalizeMarket(raw, titles, prices)).filter((value): value is Market => value !== null);
}

export async function getMarket(id: string): Promise<Market> {
  const raw = await getJson<GateMarket>(`/markets/${encodeURIComponent(id)}`);
  const prices = await tokenPrices(tokenIdsOf(raw)).catch(() => new Map<string, number>());
  const market = normalizeMarket(raw, new Map(), prices);
  if (!market) throw new Error('Market data is incomplete');
  return market;
}

/** Public trades: documented page `{ items, next_cursor }`, `trade_id`, `timestamp` in ms. */
export async function getMarketTrades(id: string, outcomes: Outcome[] = []): Promise<Trade[]> {
  const page = await getJson<Page<Record<string, unknown>>>(`/markets/${encodeURIComponent(id)}/trades?limit=30`);
  const labels = new Map(outcomes.map((outcome) => [outcome.id, outcome.label]));
  return (page.items ?? []).flatMap((row, index) => {
    const price = number(row.price); const size = number(row.size); const timestamp = number(row.timestamp);
    if (price === null || size === null) return [];
    const tokenId = String(row.token_id ?? '');
    return [{ id: String(row.trade_id ?? `${timestamp}-${tokenId}-${index}`), outcome: labels.get(tokenId) ?? '', side: String(row.side ?? ''), price, size, timestamp: timestamp ?? Date.now() }];
  });
}

export async function getOrderBook(tokenId: string): Promise<{ bids: BookLevel[]; asks: BookLevel[] }> {
  const raw = await getJson<{ bids?: {price?: string; size?: string}[]; asks?: {price?: string; size?: string}[] }>(`/tokens/${encodeURIComponent(tokenId)}/order_book?depth=20`);
  const map = (rows: {price?: string; size?: string}[] = []) => rows.flatMap((row) => {
    const price = number(row.price); const size = number(row.size); return price === null || size === null ? [] : [{ price, size }];
  });
  return { bids: map(raw.bids), asks: map(raw.asks) };
}

/** Price history: `from` / `to` and point `t` are Unix milliseconds; max range 14 days. */
export async function getPriceHistory(tokenId: string): Promise<PricePoint[]> {
  const to = Date.now(); const from = to - 7 * 86_400_000;
  const raw = await getJson<{ history?: {p?: string; t?: number}[] }>(`/tokens/${encodeURIComponent(tokenId)}/price_history?interval=1h&from=${from}&to=${to}`);
  return (raw.history ?? []).flatMap((point) => { const price = number(point.p); return price === null || !point.t ? [] : [{ price, timestamp: point.t < 10_000_000_000 ? point.t * 1000 : point.t }]; });
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

function normalizeMarket(raw: GateMarket, eventTitles: Map<string, string>, prices: Map<string, number>): Market | null {
  const id = raw.market_id; const question = text(raw.question) || raw.title || text(raw.event_title);
  if (!id || !question) return null;
  const rows = (raw.outcomes ?? []).flatMap((outcome) => {
    const outcomeId = outcome.token_id || outcome.clob_token_id; const label = text(outcome.outcome);
    return outcomeId && label ? [{ id: outcomeId, label }] : [];
  });
  if (!rows.length) return null;
  const filled = outcomePrices(raw, rows.map((row) => row.id), prices);
  const outcomes = rows.map((row, index) => ({ ...row, price: filled[index] ?? null }));
  return { id, eventId: raw.event_id ?? null, eventTitle: text(raw.event_title) || (raw.event_id ? eventTitles.get(raw.event_id) ?? null : null), conditionId: raw.condition_id ?? null, question, description: text(raw.description), category: raw.category || firstTag(raw.tags) || 'Markets', imageUrl: raw.image || raw.icon || raw.event_icon_url || null, closesAt: date(raw.end_date ?? raw.end_time), volume: number(raw.volume) ?? 0, volume24h: number(raw.volume_24hr) ?? 0, liquidity: number(raw.liquidity) ?? 0, bestBid: number(raw.best_bid), bestAsk: number(raw.best_ask), acceptingOrders: raw.accepting_orders !== false && !raw.closed, outcomes };
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
