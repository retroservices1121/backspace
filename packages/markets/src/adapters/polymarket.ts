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

/**
 * Polymarket adapter — SHELL ONLY.
 *
 * Polymarket runs a CLOB on Polygon. Their public Gamma API serves the market
 * catalog, the CLOB API handles order placement, and condition_id is the
 * stable cross-API market identifier.
 *
 *   Catalog:  https://gamma-api.polymarket.com/markets
 *   CLOB:     https://clob.polymarket.com   (signed orders)
 *   Docs:     https://docs.polymarket.com
 *
 * This shell defines the structure; the live calls land in the Phase 2 PR
 * once we wire the Polygon RPC and signer setup.
 */
export class PolymarketAdapter implements MarketVenue {
  readonly id = 'POLYMARKET' as const;

  constructor(
    private readonly opts: {
      gammaUrl?: string;
      clobUrl?: string;
      // Optional API key — Polymarket's catalog is public, CLOB needs signing
      apiKey?: string;
    } = {},
  ) {}

  async listMarkets(_args: ListMarketsArgs): Promise<ListMarketsResult> {
    throw new Error('PolymarketAdapter.listMarkets not implemented');
  }

  async getMarket(_ref: VenueMarketRef): Promise<VenueMarket | null> {
    throw new Error('PolymarketAdapter.getMarket not implemented');
  }

  async quote(_args: QuoteArgs): Promise<Quote> {
    throw new Error('PolymarketAdapter.quote not implemented');
  }

  async submit(_args: SubmitArgs): Promise<SubmitResult> {
    throw new Error('PolymarketAdapter.submit not implemented');
  }
}
