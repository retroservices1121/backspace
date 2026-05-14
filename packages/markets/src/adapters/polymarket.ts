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
 * catalog (read-only, no auth), the CLOB API handles order placement (signed
 * orders), and `condition_id` is the stable cross-API market identifier we
 * persist as Market.externalId.
 *
 *   Catalog:  https://gamma-api.polymarket.com/markets
 *   CLOB:     https://clob.polymarket.com   (signed orders)
 *   Docs:     https://docs.polymarket.com
 *
 * Implemented now:
 *   - listMarkets / getMarket  Catalog reads via Gamma. These let the
 *                              importer cache markets and outcomes into our
 *                              Market and Outcome tables and refresh prices.
 *
 * Still throwing:
 *   - quote / submit           Need CLOB integration (signed orders + a
 *                              Polygon RPC + signer setup). Out of scope
 *                              for the catalog-import pass.
 */
const DEFAULT_GAMMA_URL = 'https://gamma-api.polymarket.com';
const DEFAULT_CLOB_URL = 'https://clob.polymarket.com';

// What we accept off the wire from Gamma. The catalog endpoint returns
// camelCase keys and packs outcome data into THREE parallel JSON-encoded
// string arrays (`outcomes`, `outcomePrices`, `clobTokenIds`) rather than
// an array of objects. Some fields appear under multiple historical names
// (`endDate` full ISO timestamp vs. `endDateIso` date-only); accept either.
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
  // Outcome triplet — each is a JSON-encoded string at the wire level.
  outcomes?: string;
  outcomePrices?: string;
  clobTokenIds?: string;
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
    // Use Gamma's /markets/keyset endpoint — the builder docs recommend it
    // for catalog scans because it scales past offset-based pagination
    // without skipping/repeating rows when the catalog mutates between
    // pages. The cursor in our contract IS Polymarket's opaque
    // `next_cursor`; we pass it through unchanged.
    //
    // The endpoint explicitly rejects `offset` (422 validation error), so
    // do not pass it.
    const limit = clampLimit(args.limit);

    const qs = new URLSearchParams();
    qs.set('limit', String(limit));
    qs.set('active', 'true');
    qs.set('closed', 'false');
    if (args.cursor) qs.set('after_cursor', args.cursor);
    if (args.category) qs.set('category', args.category);
    if (args.search) qs.set('q', args.search);

    const raw = await this.fetchJson<{ markets?: RawMarket[]; next_cursor?: string }>(
      `/markets/keyset?${qs.toString()}`,
    );
    const list = raw.markets ?? [];
    const markets = list
      .map((m) => mapRawMarket(m))
      .filter((m): m is VenueMarket => m !== null);

    // Per docs: "Present only when the number of returned markets equals
    // the effective limit. Omitted on the last page." We surface that
    // exact semantic as `cursor: null` for the final page.
    const nextCursor = raw.next_cursor ?? null;
    return { markets, cursor: nextCursor };
  }

  async getMarket(ref: VenueMarketRef): Promise<VenueMarket | null> {
    if (ref.venue !== this.id) return null;
    // Gamma's path-based `/markets/{id}` keys on the numeric id, not on
    // conditionId, so we query with `?condition_ids=` and pluck the one
    // (or zero) returned row. Same wire shape as listMarkets, so the
    // existing mapper handles it directly.
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
    // CLOB integration lands in a follow-up. The trade-from-timeline UI
    // already routes intents through this method, so the error message
    // makes the missing piece explicit.
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

function clampLimit(requested: number | undefined): number {
  if (!requested || requested <= 0) return 50;
  return Math.min(requested, 200);
}

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
