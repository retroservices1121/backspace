// Helpers for signing + submitting Dflow swap transactions. Takes the
// provider-agnostic SolanaWallet from lib/wallet so this module doesn't
// know whether Privy or CDP is mounted underneath.
//
// We stay clear of wallet.signAndSendTransaction so we control the
// RPC + can surface the txid before confirmation.

import type { SolanaWallet } from '@src/lib/wallet';

import { solanaRpcUrl } from './config';

// PUBLIC mainnet-beta is the documented fallback for the embedded
// wallet; for production traffic the user must provide a paid RPC via
// NEXT_PUBLIC_SOLANA_RPC_URL.
const PUBLIC_MAINNET_RPC = 'https://api.mainnet-beta.solana.com';

/** Sign a base64-encoded VersionedTransaction with the wallet and
 *  broadcast it through the configured RPC. Returns the submitted tx
 *  signature (NOT a confirmed receipt — caller awaits confirmation). */
export async function signAndSendDflowSwap(
  wallet: SolanaWallet,
  swapTransactionBase64: string,
): Promise<{ signature: string; rpcUrl: string }> {
  const web3 = await import('@solana/web3.js');
  const rpcUrl = solanaRpcUrl() ?? PUBLIC_MAINNET_RPC;
  const connection = new web3.Connection(rpcUrl, 'confirmed');

  const txBuf = Uint8Array.from(atob(swapTransactionBase64), (c) => c.charCodeAt(0));
  const tx = web3.VersionedTransaction.deserialize(txBuf);

  const signed = await wallet.signTransaction(tx);

  const signature = await connection.sendRawTransaction(
    (signed as { serialize: () => Uint8Array }).serialize(),
    {
      skipPreflight: false,
      maxRetries: 3,
    },
  );
  return { signature, rpcUrl };
}
