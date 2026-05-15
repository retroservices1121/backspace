// Dflow swap orchestrator. Walks the full path: /quote → /swap →
// sign → submit, returning the on-chain tx signature.
//
// Two-step flow: get a quote first (so the UI can show the user what
// they'll receive), then execute the swap from that quote. The
// quote is short-lived — pricing is from a routing snapshot that
// expires within seconds — so for the cleanest UX the UI grabs a
// fresh quote right before submitting.

import type { ConnectedSolanaWallet } from '@privy-io/react-auth';

import { getDflowQuote, type DflowQuote, type GetQuoteArgs } from './quote';
import { signAndSendDflowSwap } from './signer';
import { getDflowSwapTransaction } from './swap';

export type ExecuteSwapArgs = {
  wallet: ConnectedSolanaWallet;
  quote: DflowQuote;
};

export type ExecuteSwapResult = {
  signature: string;
  explorerUrl: string;
  /** Echo the quote so callers can stash a record of what they got. */
  quote: DflowQuote;
};

/** Re-export the quote step so callers can show a preview before committing. */
export async function previewSwap(args: GetQuoteArgs): Promise<DflowQuote> {
  return getDflowQuote(args);
}

/** Build, sign, and broadcast the swap. Caller is responsible for
 *  awaiting confirmation if they want to gate UI on finality. */
export async function executeSwap({
  wallet,
  quote,
}: ExecuteSwapArgs): Promise<ExecuteSwapResult> {
  const swap = await getDflowSwapTransaction(wallet.address, quote);
  const { signature } = await signAndSendDflowSwap(wallet, swap.swapTransaction);
  return {
    signature,
    explorerUrl: `https://solscan.io/tx/${signature}`,
    quote,
  };
}
