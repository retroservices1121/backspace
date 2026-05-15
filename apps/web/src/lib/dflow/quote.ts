// Client-side wrapper around /api/dflow/quote. The server proxy holds
// the x-api-key + enforces the platform-fee params, so the browser
// just supplies the trade legs.

import axios from '@src/lib/axios';

/** Subset of the Dflow quote response we care about. The route plan is
 *  passed through opaquely to /swap so we keep the full object around. */
export type DflowQuote = {
  inputMint: string;
  outputMint: string;
  /** Raw in atomic units (lamports for SOL, integer base units for SPL). */
  inAmount: string;
  outAmount: string;
  /** Worst-case output after slippage, base units. */
  otherAmountThreshold: string;
  swapMode: 'ExactIn' | 'ExactOut' | string;
  slippageBps: number;
  /** Decimal as a string. Useful for surfacing routing impact. */
  priceImpactPct: string;
  routePlan: unknown[];
  /** Some venues echo platformFee back on the quote. We don't rely on
   *  it for display (we know the bps locally) but we do pass it through. */
  platformFee?: {
    amount: string;
    feeBps: number;
  } | null;
} & Record<string, unknown>;

export type GetQuoteArgs = {
  inputMint: string;
  outputMint: string;
  /** Input amount in atomic units (NOT human-decimal). Use
   *  toAtomicAmount() in lib/dflow/amounts to convert. */
  amount: string;
  /** Defaults to 50 bps (0.5%) — Jupiter/Dflow's typical default. */
  slippageBps?: number;
};

export async function getDflowQuote(args: GetQuoteArgs): Promise<DflowQuote> {
  const { data } = await axios().get('/dflow/quote', {
    params: {
      inputMint: args.inputMint,
      outputMint: args.outputMint,
      amount: args.amount,
      slippageBps: String(args.slippageBps ?? 50),
    },
  });
  return data as DflowQuote;
}
