import type { MarketVenue } from '../venue';
import type {
  ListMarketsArgs,
  ListMarketsResult,
  Quote,
  QuoteArgs,
  SubmitArgs,
  SubmitResult,
  VenueMarket,
  VenueMarketRef,
} from '../types';

const DEFAULT_API_URL = 'https://api.dexbuilder.com';
const API_PREFIX = '/api/v4/prediction';

type Localized = string | Record<string, unknown> | null;

type GateOutcome = {
  outcome?: Localized;
  token_id?: string;
  clob_token_id?: string;
  price?: string;
};

type GateMarket = {
  accepting_orders?: boolean;
  active?: boolean;
  best_ask?: string;
  best_bid?: string;
  category?: string;
  closed?: boolean;
  condition_id?: string;
  description?: Localized;
  enable_order_book?: boolean;
  end_date?: number;
  end_time?: number;
  event_icon_url?: string;
  event_id?: string;
  event_title?: string;
  icon?: string;
  image?: string;
  last_trade_price?: string;
  liquidity?: string;
  market_id?: string;
  neg_risk?: boolean;
  outcomes?: GateOutcome[];
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

type GateMarketPage = {
  items?: GateMarket[];
  next_cursor?: string;
  total?: number;
};

/** Public Prediction Markets adapter for Gate DexBuilder. */
export class GatePredictionAdapter implements MarketVenue {
  readonly id = 'GATE' as const;

  private readonly apiUrl: string;

  constructor(opts: { apiUrl?: string } = {}) {
    this.apiUrl = (opts.apiUrl ?? DEFAULT_API_URL).replace(/\/+$/, '');
  }

  async listMarkets(args: ListMarketsArgs): Promise<ListMarketsResult> {
    const qs = new URLSearchParams({
      limit: String(clampLimit(args.limit)),
      active: 'true',
      closed: 'false',
    });
    if (args.cursor) qs.set('cursor', args.cursor);
    if (args.category) qs.set('tag_slug', args.category);

    const page = await this.fetchJson<GateMarketPage>(`/markets?${qs.toString()}`);
    const markets = (page.items ?? [])
      .map(mapMarket)
      .filter((market): market is VenueMarket => market !== null)
      .filter((market) => market.status === 'ACTIVE')
      .filter((market) =>
        args.search
          ? market.question.toLowerCase().includes(args.search.toLowerCase())
          : true,
      );

    // Current OpenAPI documents both cursor pagination and a legacy
    // items+total response. Only continue when the server returns a cursor.
    return { markets, cursor: page.next_cursor || null };
  }

  async getMarket(ref: VenueMarketRef): Promise<VenueMarket | null> {
    if (ref.venue !== this.id) return null;
    const summary = await this.fetchJson<GateMarket | null>(
      `/markets/${encodeURIComponent(ref.externalId)}`,
      { allow404: true },
    );
    if (!summary) return null;

    // The documented slug route returns richer rule and resolution fields.
    const raw = summary.slug
      ? await this.fetchJson<GateMarket>(
          `/markets/slug/${encodeURIComponent(summary.slug)}`,
        ).catch(() => summary)
      : summary;
    return mapMarket(raw);
  }

  async quote(_args: QuoteArgs): Promise<Quote> {
    throw new Error('GatePredictionAdapter.quote requires authenticated account credentials');
  }

  async submit(_args: SubmitArgs): Promise<SubmitResult> {
    throw new Error('GatePredictionAdapter.submit requires authenticated account credentials');
  }

  private async fetchJson<T>(
    path: string,
    opts: { allow404?: boolean } = {},
  ): Promise<T> {
    const res = await fetch(`${this.apiUrl}${API_PREFIX}${path}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.status === 404 && opts.allow404) return null as T;
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Gate DexBuilder ${res.status} on ${path}: ${body.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  }
}

function mapMarket(raw: GateMarket): VenueMarket | null {
  if (!raw.market_id) return null;
  const question = localizedText(raw.question) || raw.title || raw.event_title;
  const closesAt = unixDate(raw.end_date ?? raw.end_time);
  if (!question || !closesAt) return null;

  const outcomes = (raw.outcomes ?? []).flatMap((outcome) => {
    const externalId = outcome.token_id || outcome.clob_token_id;
    const label = localizedText(outcome.outcome);
    if (!externalId || !label) return [];
    const price = validDecimal(outcome.price);
    return [{
      externalId,
      label,
      lastPrice: price,
      lastPriceAt: price ? new Date() : null,
    }];
  });
  if (outcomes.length === 0) return null;

  const status = marketStatus(raw, closesAt);
  return {
    venue: 'GATE',
    externalId: raw.market_id,
    question,
    description: localizedText(raw.description) || '',
    category: raw.category || firstTag(raw.tags),
    imageUrl: raw.image || raw.icon || raw.event_icon_url || null,
    chain: null,
    contractAddress: raw.condition_id || null,
    negRisk: raw.neg_risk === true,
    status,
    opensAt: unixDate(raw.start_date ?? raw.start_time),
    closesAt,
    resolvedAt: unixDate(raw.resolved_at),
    slug: raw.slug || null,
    resolutionSource: raw.resolution_source || null,
    winningOutcome: raw.winning_outcome || null,
    acceptingOrders: status === 'ACTIVE' && raw.accepting_orders !== false,
    tickSize: validDecimal(raw.tick_size),
    volumeUsd: positiveDecimal(raw.volume),
    volume24hUsd: positiveDecimal(raw.volume_24hr),
    liquidityUsd: positiveDecimal(raw.liquidity),
    outcomes,
  };
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

function unixDate(value: number | undefined): Date | null {
  if (!Number.isFinite(value)) return null;
  const milliseconds = (value as number) < 10_000_000_000 ? (value as number) * 1000 : value as number;
  const date = new Date(milliseconds);
  return Number.isFinite(date.getTime()) ? date : null;
}

function validDecimal(value: string | undefined): string | null {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? value : null;
}

function positiveDecimal(value: string | undefined): string | null {
  const decimal = validDecimal(value);
  return decimal !== null && Number(decimal) > 0 ? decimal : null;
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

function marketStatus(raw: GateMarket, closesAt: Date): VenueMarket['status'] {
  const status = raw.status?.toUpperCase();
  if (status === 'INVALIDATED' || status === 'INVALID') return 'INVALIDATED';
  if (raw.closed || status === 'RESOLVED' || status === 'SETTLED') return 'RESOLVED';
  if (closesAt.getTime() <= Date.now()) return 'FROZEN';
  if (raw.active === false || raw.accepting_orders === false || status === 'FROZEN') return 'FROZEN';
  return 'ACTIVE';
}

function clampLimit(limit: number | undefined): number {
  if (!limit || limit < 1) return 50;
  return Math.min(limit, 200);
}

