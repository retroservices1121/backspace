import type { MarketVenue } from '../venue';
import type {
  ListMarketsArgs,
  ListMarketsResult,
  ProbabilityStr,
  Quote,
  QuoteArgs,
  SubmitArgs,
  SubmitResult,
  VenueMarket,
  VenueMarketRef,
  VenueOutcome,
} from '../types';

/**
 * Polymarket adapter.
 *
 * Polymarket runs a CLOB on Polygon. Their public Gamma API serves the market
 * catalog (read-only, no auth) and the CLOB API handles order placement.
 *
 *   Catalog:  https://gamma-api.polymarket.com/events
 *   CLOB:     https://clob.polymarket.com   (signed orders)
 *   Docs:     https://docs.polymarket.com
 *
 * We read the catalog from the /events endpoint, not /markets, because
 * Polymarket groups markets by event:
 *   - A negRisk event (a "Who wins X?" market) is ONE multi-outcome
 *     market, but under the hood it is N separate Yes/No conditionId
 *     markets, one per candidate. We collapse it back into a single
 *     VenueMarket whose outcomes are the candidates (label =
 *     groupItemTitle, externalId = the candidate YES clob token id).
 *     Its externalId is event-{id}.
 *   - A plain event just groups independent binary markets by topic; we
 *     emit each of its markets as its own VenueMarket (externalId =
 *     conditionId), exactly as before.
 *
 * Still throwing:
 *   - quote / submit  CLOB integration lives in apps/web/src/lib/polymarket.
 */
const DEFAULT_GAMMA_URL = 'https://gamma-api.polymarket.com';
const DEFAULT_CLOB_URL = 'https://clob.polymarket.com';

// externalId prefix for negRisk-event-grouped markets — distinguishes
// them from plain markets, which are keyed by their 0x… conditionId.
const EVENT_PREFIX = 'event-';

// A negRisk event can carry 100+ candidate sub-markets; the long tail is
// all ~0% noise. Keep the highest-probability ones and cap the rest so a
// single event doesn't dominate an import sweep with per-outcome upserts.
const MAX_OUTCOMES_PER_MARKET = 100;

// A single Gamma market. The catalog packs outcome data into THREE
// parallel JSON-encoded string arrays (`outcomes`, `outcomePrices`,
// `clobTokenIds`). For a negRisk sub-market `groupItemTitle` is the
// candidate name and `clobTokenIds` is [YES, NO].
type RawMarket = {
  id?: string | number;
  conditionId?: string;
  question?: string;
  description?: string;
  category?: string | null;
  image?: string | null;
  icon?: string | null;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  endDate?: string | null;
  endDateIso?: string | null;
  startDate?: string | null;
  startDateIso?: string | null;
  negRisk?: boolean;
  // Candidate name on a negRisk sub-market (e.g. "Spain").
  groupItemTitle?: string;
  // Outcome triplet — each is a JSON-encoded string at the wire level.
  outcomes?: string;
  outcomePrices?: string;
  clobTokenIds?: string;
  // Gamma exposes both a string and a numeric flavor for these.
  // Prefer the string; fall back to stringifying the numeric.
  volume?: string | number | null;
  volumeNum?: number | null;
  volume24hr?: string | number | null;
  liquidity?: string | number | null;
};

type RawTag = { label?: string; slug?: string };

// A Gamma event — the grouping unit. `negRisk` distinguishes a
// multi-outcome market from a topical bundle of independent markets.
type RawEvent = {
  id?: string | number;
  slug?: string;
  title?: string;
  description?: string;
  image?: string | null;
  icon?: string | null;
  negRisk?: boolean;
  negRiskMarketID?: string | null;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  tags?: RawTag[];
  markets?: RawMarket[];
  // Aggregated event volume (sums across sub-markets on negRisk events).
  volume?: string | number | null;
  volume24hr?: string | number | null;
  liquidity?: string | number | null;
};

export class PolymarketAdapter implements MarketVenue {
  readonly id = 'POLYMARKET' as const;

  private readonly gammaUrl: string;

  private readonly clobUrl: string;

  private readonly apiKey?: string;

  constructor(
    opts: {
      gammaUrl?: string;
      clobUrl?: string;
      // Optional API key — Polymarket's catalog is public, CLOB needs signing
      apiKey?: string;
    } = {},
  ) {
    this.gammaUrl = (opts.gammaUrl ?? DEFAULT_GAMMA_URL).replace(/\/+$/, '');
    this.clobUrl = (opts.clobUrl ?? DEFAULT_CLOB_URL).replace(/\/+$/, '');
    this.apiKey = opts.apiKey;
  }

  async listMarkets(args: ListMarketsArgs): Promise<ListMarketsResult> {
    // The /events endpoint is offset-paginated. Our ListMarketsResult
    // `cursor` contract carries Gamma's `offset` as a string — opaque to
    // the importer, which just passes it back to fetch the next page.
    const limit = clampLimit(args.limit);
    const offset = parseOffset(args.cursor);

    const qs = new URLSearchParams();
    qs.set('limit', String(limit));
    qs.set('offset', String(offset));
    qs.set('active', 'true');
    qs.set('closed', 'false');
    if (args.search) qs.set('q', args.search);

    const raw = await this.fetchJson<RawEvent[] | { data?: RawEvent[] }>(
      `/events?${qs.toString()}`,
    );
    const events = Array.isArray(raw) ? raw : (raw.data ?? []);
    const markets = events.flatMap((e) => mapEvent(e));

    // Offset pagination: another page exists only when this one came back
    // full. null cursor = last page.
    const cursor = events.length === limit ? String(offset + limit) : null;
    return { markets, cursor };
  }

  async getMarket(ref: VenueMarketRef): Promise<VenueMarket | null> {
    if (ref.venue !== this.id) return null;

    // negRisk-grouped markets are keyed by `event-{id}` — resolve them
    // through the events endpoint.
    if (ref.externalId.startsWith(EVENT_PREFIX)) {
      const eventId = ref.externalId.slice(EVENT_PREFIX.length);
      const raw = await this.fetchJson<RawEvent[] | RawEvent | null>(
        `/events?id=${encodeURIComponent(eventId)}`,
        { allow404: true },
      );
      if (!raw) return null;
      const event = Array.isArray(raw) ? raw[0] : raw;
      return event ? mapNegRiskEvent(event) : null;
    }

    // Plain market — keyed by conditionId. Gamma's path-based
    // `/markets/{id}` keys on the numeric id, so query `?condition_ids=`.
    const qs = new URLSearchParams();
    qs.set('condition_ids', ref.externalId);
    qs.set('limit', '1');
    const raw = await this.fetchJson<RawMarket[] | { markets: RawMarket[] }>(
      `/markets?${qs.toString()}`,
    );
    const list = Array.isArray(raw) ? raw : (raw.markets ?? []);
    if (list.length === 0) return null;
    return mapRawMarket(list[0]!);
  }

  async quote(_args: QuoteArgs): Promise<Quote> {
    // CLOB integration lives client-side in apps/web/src/lib/polymarket.
    throw new Error(
      'PolymarketAdapter.quote: CLOB signed-order integration not yet wired',
    );
  }

  async submit(_args: SubmitArgs): Promise<SubmitResult> {
    throw new Error(
      'PolymarketAdapter.submit: CLOB signed-order integration not yet wired',
    );
  }

  private async fetchJson<T>(
    path: string,
    opts: { allow404?: boolean } = {},
  ): Promise<T> {
    const url = `${this.gammaUrl}${path}`;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    const res = await fetch(url, { headers });
    if (res.status === 404 && opts.allow404) {
      return null as T;
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Polymarket Gamma ${res.status} on ${path}: ${body.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  }
}

function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}

// Gamma sends volume / liquidity as either a string ("12345.67") or a
// number. Normalize to a fixed-string Cents value so the importer
// stores a Decimal cleanly. Returns null for missing/0/invalid so the
// DB column stays null rather than "0" (sort orders treat null as
// "no data" rather than "least").
function toCentsOrNull(v: string | number | null | undefined): string | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number.parseFloat(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toFixed(6);
}

// Sum volume fields across an event's sub-markets. Used as a fallback
// when the event row itself doesn't expose aggregated volume.
function sumMarketField(
  markets: RawMarket[] | undefined,
  pick: (m: RawMarket) => string | number | null | undefined,
): string | null {
  if (!markets || markets.length === 0) return null;
  let total = 0;
  let saw = false;
  for (const m of markets) {
    const raw = pick(m);
    if (raw == null) continue;
    const n = typeof raw === 'number' ? raw : Number.parseFloat(raw);
    if (!Number.isFinite(n)) continue;
    total += n;
    saw = true;
  }
  return saw && total > 0 ? total.toFixed(6) : null;
}

function clampLimit(requested: number | undefined): number {
  if (!requested || requested <= 0) return 50;
  return Math.min(requested, 200);
}

function parseOffset(cursor: string | undefined): number {
  if (!cursor) return 0;
  const n = parseInt(cursor, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function firstTagLabel(event: RawEvent): string | null {
  const tag = event.tags?.find((t) => t && typeof t.label === 'string');
  return tag?.label ?? null;
}

// One Gamma event -> zero or more VenueMarkets.
//   negRisk event -> a single multi-outcome market.
//   plain event   -> each of its markets emitted independently.
function mapEvent(event: RawEvent): VenueMarket[] {
  if (event.negRisk === true) {
    const grouped = mapNegRiskEvent(event);
    return grouped ? [grouped] : [];
  }
  return (event.markets ?? [])
    .map((m) => mapRawMarket(m))
    .filter((m): m is VenueMarket => m !== null);
}

// Collapse a negRisk event into one multi-outcome VenueMarket. Each
// sub-market becomes an outcome: betting on that candidate means buying
// its YES token (clobTokenIds[0]).
function mapNegRiskEvent(event: RawEvent): VenueMarket | null {
  if (event.id == null || !event.title) return null;
  const closesAt = parseDate(event.endDate);
  if (!closesAt) return null;

  const outcomes: VenueOutcome[] = [];
  for (const sub of event.markets ?? []) {
    // Skip resolved / inactive candidates.
    if (sub.closed || sub.active === false) continue;
    const tokenIds = parseStringArray(sub.clobTokenIds);
    const prices = parseStringArray(sub.outcomePrices);
    // clobTokenIds is [YES, NO]; the YES token is what you buy to back
    // this candidate.
    const yesToken = tokenIds[0];
    const label = sub.groupItemTitle || sub.question;
    if (!yesToken || !label) continue;
    const rawPrice = prices[0];
    const lastPrice: ProbabilityStr | null =
      rawPrice && rawPrice !== '' ? rawPrice : null;
    outcomes.push({
      externalId: yesToken,
      label,
      lastPrice,
      lastPriceAt: lastPrice !== null ? new Date() : null,
    });
  }
  if (outcomes.length === 0) return null;

  // Highest-probability candidates first, then cap the long tail.
  outcomes.sort((a, b) => Number(b.lastPrice ?? 0) - Number(a.lastPrice ?? 0));

  // Volume: prefer event-level aggregate when present, otherwise sum
  // the sub-markets so a negRisk event still gets ranked.
  const volumeUsd =
    toCentsOrNull(event.volume) ??
    sumMarketField(event.markets, (m) => m.volume ?? m.volumeNum ?? null);
  const volume24hUsd =
    toCentsOrNull(event.volume24hr) ??
    sumMarketField(event.markets, (m) => m.volume24hr ?? null);
  const liquidityUsd =
    toCentsOrNull(event.liquidity) ??
    sumMarketField(event.markets, (m) => m.liquidity ?? null);

  return {
    venue: 'POLYMARKET',
    externalId: `${EVENT_PREFIX}${event.id}`,
    question: event.title,
    description: event.description ?? '',
    category: firstTagLabel(event),
    imageUrl: event.image ?? event.icon ?? null,
    chain: 'polygon',
    // negRisk events settle through the NegRisk adapter — there's no
    // single conditionId, so key the on-chain ref on negRiskMarketID.
    contractAddress: event.negRiskMarketID ?? null,
    negRisk: true,
    status: deriveEventStatus(event),
    opensAt: parseDate(event.startDate),
    resolvedAt: event.closed ? closesAt : null,
    closesAt,
    volumeUsd,
    volume24hUsd,
    liquidityUsd,
    outcomes: outcomes.slice(0, MAX_OUTCOMES_PER_MARKET),
  };
}

// A plain binary (or otherwise self-contained) Gamma market.
function mapRawMarket(raw: RawMarket): VenueMarket | null {
  const externalId = raw.conditionId;
  const question = raw.question;
  if (!externalId || !question) return null;

  // Prefer the full timestamp; fall back to the date-only flavor.
  const closesAt = parseDate(raw.endDate) ?? parseDate(raw.endDateIso);
  if (!closesAt) return null; // a market without a close date is not actionable

  return {
    venue: 'POLYMARKET',
    externalId,
    question,
    description: raw.description ?? '',
    category: raw.category ?? null,
    imageUrl: raw.image ?? raw.icon ?? null,
    chain: 'polygon',
    contractAddress: externalId, // conditionId is the on-chain identifier
    negRisk: raw.negRisk === true,
    status: deriveStatus(raw),
    opensAt: parseDate(raw.startDate) ?? parseDate(raw.startDateIso),
    resolvedAt: raw.closed ? closesAt : null,
    closesAt,
    volumeUsd: toCentsOrNull(raw.volume ?? raw.volumeNum),
    volume24hUsd: toCentsOrNull(raw.volume24hr),
    liquidityUsd: toCentsOrNull(raw.liquidity),
    outcomes: zipOutcomes(raw),
  };
}

// Gamma serializes outcome metadata as three parallel JSON-string arrays.
// We zip them by index into VenueOutcome rows; if any of the three fails
// to parse or the lengths disagree we still return whatever zipped rows
// are well-formed.
function zipOutcomes(raw: RawMarket): VenueOutcome[] {
  const labels = parseStringArray(raw.outcomes);
  const prices = parseStringArray(raw.outcomePrices);
  const tokenIds = parseStringArray(raw.clobTokenIds);
  const n = Math.min(labels.length, tokenIds.length);
  const out: VenueOutcome[] = [];
  for (let i = 0; i < n; i++) {
    const externalId = tokenIds[i];
    const label = labels[i];
    if (!externalId || !label) continue;
    const rawPrice = prices[i];
    const lastPrice: ProbabilityStr | null =
      rawPrice === undefined || rawPrice === null || rawPrice === '' ? null : rawPrice;
    out.push({
      externalId,
      label,
      lastPrice,
      // Gamma does not expose a per-outcome timestamp; the importer can
      // stamp lastPriceAt to "now" when it persists the row.
      lastPriceAt: lastPrice !== null ? new Date() : null,
    });
  }
  return out;
}

function parseStringArray(encoded: string | undefined): string[] {
  if (!encoded) return [];
  try {
    const parsed = JSON.parse(encoded);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string');
  } catch {
    return [];
  }
}

function deriveStatus(raw: RawMarket): VenueMarket['status'] {
  if (raw.closed) return 'RESOLVED';
  if (raw.active === false) return 'FROZEN';
  return 'ACTIVE';
}

function deriveEventStatus(event: RawEvent): VenueMarket['status'] {
  if (event.closed) return 'RESOLVED';
  if (event.active === false) return 'FROZEN';
  return 'ACTIVE';
}
