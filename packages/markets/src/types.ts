// Venue-agnostic types. These are the wire shapes adapters return — they get
// mapped into Prisma Market / Outcome / Trade rows by the importer service.
//
// Money is *always* a string in this layer. Parsing to Decimal happens at the
// DB boundary; the wire format never uses Float.

export type Cents = string;            // USD, fixed-point string e.g. "1.23"
export type ProbabilityStr = string;   // "0..1" string e.g. "0.62"
export type SharesStr = string;        // arbitrary precision

export type VenueId = 'POLYMARKET' | 'AZURO' | 'INTERNAL';

export type VenueMarketRef = {
  venue: VenueId;
  externalId: string;
};

export type VenueOutcome = {
  externalId: string;
  label: string;
  lastPrice: ProbabilityStr | null;
  lastPriceAt: Date | null;
};

export type VenueMarket = VenueMarketRef & {
  question: string;
  description: string;
  category: string | null;
  imageUrl: string | null;
  chain: string | null;
  contractAddress: string | null;
  // Polymarket negative-risk flag — orders on these markets route
  // through the NegRisk Exchange. Non-Polymarket venues report false.
  negRisk: boolean;
  status: 'ACTIVE' | 'FROZEN' | 'RESOLVED' | 'INVALIDATED';
  opensAt: Date | null;
  closesAt: Date;
  resolvedAt: Date | null;
  // Venue-reported volume + book depth, in USD. Strings to preserve
  // precision over the wire (parsed to Decimal at the DB boundary).
  // Nullable: not every venue exposes these, and not every market
  // has activity yet.
  volumeUsd: Cents | null;
  volume24hUsd: Cents | null;
  liquidityUsd: Cents | null;
  outcomes: VenueOutcome[];
};

export type ListMarketsArgs = {
  category?: string;
  search?: string;
  cursor?: string;
  limit?: number;
};

export type ListMarketsResult = {
  markets: VenueMarket[];
  cursor: string | null;
};

export type QuoteArgs = {
  marketRef: VenueMarketRef;
  outcomeExternalId: string;
  side: 'BUY' | 'SELL';
  shares: SharesStr;
};

export type Quote = {
  shares: SharesStr;
  pricePerShare: ProbabilityStr;
  totalCostUsd: Cents;
  feeUsd: Cents;
  validUntil: Date;
  // Opaque blob the adapter needs to actually submit the trade
  venuePayload: unknown;
};

export type SubmitArgs = {
  quote: Quote;
  // Wallet the trade settles from (chain + address). Passthrough adapters use
  // this to route to the right onchain account; off-chain venues ignore.
  wallet: { chain: string; address: string };
};

export type SubmitResult = {
  txHash: string | null;
  venueOrderId: string | null;
  status: 'PENDING' | 'FILLED' | 'REJECTED';
};
