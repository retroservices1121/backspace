// Client-side wrapper around /api/dflow/swap. Posts the quote + the
// user's Solana public key, gets back a base64 swapTransaction the
// embedded wallet signs and we submit to the RPC.

import axios from '@src/lib/axios';

import type { DflowQuote } from './quote';

export type DflowSwapResponse = {
  /** Base64-encoded VersionedTransaction. */
  swapTransaction: string;
  /** Solana block height after which the tx is no longer valid. */
  lastValidBlockHeight: number;
} & Record<string, unknown>;

export async function getDflowSwapTransaction(
  userPublicKey: string,
  quoteResponse: DflowQuote,
): Promise<DflowSwapResponse> {
  const { data } = await axios().post('/dflow/swap', {
    userPublicKey,
    quoteResponse,
  });
  return data as DflowSwapResponse;
}
