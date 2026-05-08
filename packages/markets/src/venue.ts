import type {
  ListMarketsArgs,
  ListMarketsResult,
  Quote,
  QuoteArgs,
  SubmitArgs,
  SubmitResult,
  VenueId,
  VenueMarket,
  VenueMarketRef,
} from './types';

/**
 * The contract every venue adapter implements. Designed so:
 *
 *   - listMarkets / getMarket let us cache a venue's catalog into our Market
 *     and Outcome tables (and refresh prices).
 *   - quote / submit drive a trade-from-timeline flow without the UI knowing
 *     which venue it is talking to.
 *   - Resolution polling lives outside this interface (a separate cron) so
 *     adapters stay simple.
 *
 * Adapters MUST be idempotent on getMarket — same externalId → same shape.
 * Returned dates MUST be Date objects, not ISO strings.
 */
export interface MarketVenue {
  readonly id: VenueId;

  listMarkets(args: ListMarketsArgs): Promise<ListMarketsResult>;
  getMarket(ref: VenueMarketRef): Promise<VenueMarket | null>;

  quote(args: QuoteArgs): Promise<Quote>;
  submit(args: SubmitArgs): Promise<SubmitResult>;
}

// Registry — populated by app code, not by this package, so the adapter
// implementations can stay independent of each other.
export class VenueRegistry {
  private map = new Map<VenueId, MarketVenue>();

  register(venue: MarketVenue) {
    this.map.set(venue.id, venue);
  }

  get(id: VenueId): MarketVenue {
    const v = this.map.get(id);
    if (!v) throw new Error(`No adapter registered for venue ${id}`);
    return v;
  }

  has(id: VenueId): boolean {
    return this.map.has(id);
  }
}
