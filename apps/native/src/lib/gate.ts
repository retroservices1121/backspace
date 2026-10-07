import { fetch } from 'expo/fetch';

export const GATE_API = process.env.EXPO_PUBLIC_GATE_API_URL ?? 'https://api.dexbuilder.com/api/v4/prediction';
export const GATE_WS = process.env.EXPO_PUBLIC_GATE_WS_URL ?? 'wss://broker.dexbuilder.com/ws/dex-builder/prediction';

type Localized = string | Record<string, unknown> | null;
export type GateOutcome = { outcome?: Localized; token_id?: string; clob_token_id?: string; price?: string };
export type GateMarket = {
  accepting_orders?: boolean; active?: boolean; best_ask?: string; best_bid?: string; category?: string; closed?: boolean;
  condition_id?: string; description?: Localized; end_date?: number; end_time?: number; event_icon_url?: string; event_id?: string;
  event_title?: Localized; icon?: string; image?: string; last_trade_price?: string; liquidity?: string; market_id?: string;
  outcomes?: GateOutcome[]; question?: Localized; resolution_source?: string; slug?: string; status?: string; tags?: unknown;
  title?: string; volume?: string; volume_24hr?: string;
};
type GateEvent = { event_id?: string; title?: Localized };
type Page<T> = { items?: T[]; next_cursor?: string; total?: number };

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

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${GATE_API}${path}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Gate returned ${response.status}`);
  return response.json() as Promise<T>;
}

export async function listMarkets(): Promise<Market[]> {
  const [marketPage, eventPage] = await Promise.all([
    getJson<Page<GateMarket>>('/markets?limit=200&active=true&closed=false'),
    getJson<Page<GateEvent>>('/events?limit=200&active=true&closed=false').catch(() => ({ items: [] })),
  ]);
  const titles = new Map((eventPage.items ?? []).flatMap((event) => event.event_id ? [[event.event_id, text(event.title)] as const] : []));
  return (marketPage.items ?? []).map((raw) => normalizeMarket(raw, titles)).filter((value): value is Market => value !== null);
}

export async function getMarket(id: string): Promise<Market> {
  const raw = await getJson<GateMarket>(`/markets/${encodeURIComponent(id)}`);
  const market = normalizeMarket(raw, new Map());
  if (!market) throw new Error('Market data is incomplete');
  return market;
}

export async function getMarketTrades(id: string): Promise<Trade[]> {
  const rows = await getJson<Record<string, unknown>[]>(`/markets/${encodeURIComponent(id)}/trades?limit=30`);
  return (Array.isArray(rows) ? rows : []).flatMap((row, index) => {
    const price = number(row.price); const size = number(row.size); const created = number(row.created_at);
    if (price === null || size === null) return [];
    return [{ id: String(row.id ?? `${created}-${index}`), outcome: String(row.outcome ?? ''), side: String(row.side ?? ''), price, size, timestamp: created ?? Date.now() }];
  });
}

export async function getOrderBook(tokenId: string): Promise<{ bids: BookLevel[]; asks: BookLevel[] }> {
  const raw = await getJson<{ bids?: {price?: string; size?: string}[]; asks?: {price?: string; size?: string}[] }>(`/tokens/${encodeURIComponent(tokenId)}/order_book?depth=20`);
  const map = (rows: {price?: string; size?: string}[] = []) => rows.flatMap((row) => {
    const price = number(row.price); const size = number(row.size); return price === null || size === null ? [] : [{ price, size }];
  });
  return { bids: map(raw.bids), asks: map(raw.asks) };
}

export async function getPriceHistory(tokenId: string): Promise<PricePoint[]> {
  const to = Math.floor(Date.now() / 1000); const from = to - 7 * 86400;
  const raw = await getJson<{ history?: {p?: string; t?: number}[] }>(`/tokens/${encodeURIComponent(tokenId)}/price_history?interval=1h&from=${from}&to=${to}`);
  return (raw.history ?? []).flatMap((point) => { const price = number(point.p); return price === null || !point.t ? [] : [{ price, timestamp: point.t }]; });
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

function normalizeMarket(raw: GateMarket, eventTitles: Map<string, string>): Market | null {
  const id = raw.market_id; const question = text(raw.question) || raw.title || text(raw.event_title);
  if (!id || !question) return null;
  const outcomes = (raw.outcomes ?? []).flatMap((outcome) => {
    const outcomeId = outcome.token_id || outcome.clob_token_id; const label = text(outcome.outcome);
    return outcomeId && label ? [{ id: outcomeId, label, price: number(outcome.price) }] : [];
  });
  if (!outcomes.length) return null;
  return { id, eventId: raw.event_id ?? null, eventTitle: text(raw.event_title) || (raw.event_id ? eventTitles.get(raw.event_id) ?? null : null), conditionId: raw.condition_id ?? null, question, description: text(raw.description), category: raw.category || firstTag(raw.tags) || 'Markets', imageUrl: raw.image || raw.icon || raw.event_icon_url || null, closesAt: date(raw.end_date ?? raw.end_time), volume: number(raw.volume) ?? 0, volume24h: number(raw.volume_24hr) ?? 0, liquidity: number(raw.liquidity) ?? 0, bestBid: number(raw.best_bid), bestAsk: number(raw.best_ask), acceptingOrders: raw.accepting_orders !== false && !raw.closed, outcomes };
}

export function text(value: Localized | undefined): string {
  if (typeof value === 'string') return value.trim(); if (!value || typeof value !== 'object') return '';
  for (const key of ['en', 'en_US', 'en-US', 'default']) { const item = value[key]; if (typeof item === 'string' && item.trim()) return item.trim(); }
  const first = Object.values(value).find((item) => typeof item === 'string'); return typeof first === 'string' ? first : '';
}
function number(value: unknown): number | null { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
function date(value?: number): Date | null { if (!value) return null; const result = new Date(value < 10_000_000_000 ? value * 1000 : value); return Number.isFinite(result.getTime()) ? result : null; }
function firstTag(tags: unknown): string { if (!Array.isArray(tags)) return ''; for (const tag of tags) { if (typeof tag === 'string') return tag; if (tag && typeof tag === 'object') { const record = tag as Record<string, unknown>; const label = text(record.label as Localized); if (label) return label; if (typeof record.slug === 'string') return record.slug; } } return ''; }

export function money(value: number): string { return value >= 1_000_000 ? `$${(value / 1_000_000).toFixed(1)}M` : value >= 1_000 ? `$${(value / 1_000).toFixed(0)}K` : `$${Math.round(value)}`; }
export function cents(value: number | null): string { return value === null ? '—' : `${Math.round(value * 100)}¢`; }
export function leadingOutcome(market: Market): Outcome { return [...market.outcomes].sort((a, b) => (b.price ?? -1) - (a.price ?? -1))[0]; }
