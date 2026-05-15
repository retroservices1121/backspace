// Helpers for signing + submitting Dflow swap transactions with a Privy
// Solana embedded wallet.
//
// Privy v1.99.1 ships `useSolanaWallets()` which returns
// BaseConnectedSolanaWallet objects (`type: 'solana'`,
// `signTransaction(tx)` returns the signed VersionedTransaction). We
// stay clear of `wallet.sendTransaction` so we control the RPC + can
// surface the txid before confirmation.

import type { ConnectedSolanaWallet } from '@privy-io/react-auth';

import { solanaRpcUrl } from './config';

// PUBLIC mainnet-beta is the documented fallback for the embedded
// wallet; for production traffic the user must provide a paid RPC via
// NEXT_PUBLIC_SOLANA_RPC_URL.
const PUBLIC_MAINNET_RPC = 'https://api.mainnet-beta.solana.com';

/** Returns the user's Solana embedded wallet, or undefined if none yet. */
export function pickEmbeddedSolanaWallet(
  wallets: ConnectedSolanaWallet[],
): ConnectedSolanaWallet | undefined {
  // The embedded wallet identifies as walletClientType === 'privy'. The
  // user may also have linked an external Solana wallet (Phantom etc.)
  // — we intentionally prefer the embedded one for the spot-trading
  // flow since that's the wallet we provision and fund.
  return (
    wallets.find((w) => (w as { walletClientType?: string }).walletClientType === 'privy')
    ?? wallets[0]
  );
}

/** Sign a base64-encoded VersionedTransaction with the wallet and
 *  broadcast it through the configured RPC. Returns the submitted tx
 *  signature (NOT a confirmed receipt — caller awaits confirmation). */
export async function signAndSendDflowSwap(
  wallet: ConnectedSolanaWallet,
  swapTransactionBase64: string,
): Promise<{ signature: string; rpcUrl: string }> {
  const web3 = await import('@solana/web3.js');
  const rpcUrl = solanaRpcUrl() ?? PUBLIC_MAINNET_RPC;
  const connection = new web3.Connection(rpcUrl, 'confirmed');

  const txBuf = Uint8Array.from(atob(swapTransactionBase64), (c) => c.charCodeAt(0));
  const tx = web3.VersionedTransaction.deserialize(txBuf);

  const signed = await wallet.signTransaction(tx);

  const signature = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });
  return { signature, rpcUrl };
}
