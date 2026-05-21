// Wallet plumbing for the Polymarket trade path.
//
// We accept the provider-agnostic EvmWallet from lib/wallet — the
// Privy embedded EOA today, the CDP embedded EOA after migration.
// clob-client-v2 and builder-relayer-client both want an ethers v5
// signer, so we adapt the wallet's EIP-1193 provider into one. A
// read-only viem publicClient handles balance/allowance reads.
import { providers } from 'ethers';
import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';

import type { EvmWallet } from '@src/lib/wallet';

import { POLYGON_CHAIN_ID, polygonRpcUrl } from './config';

/** @deprecated Use EvmWallet from @src/lib/wallet directly. Kept as
 *  an alias during the abstraction migration so callers that still
 *  import this name compile. Remove once no one references it. */
export type PrivyWalletLike = EvmWallet;

// Concrete (non-generic) factory so the inferred type keeps its
// transport/chain generics — `ReturnType<typeof createPublicClient>`
// erases them and breaks viem's strict readContract typing.
function makePublicClient() {
  return createPublicClient({
    chain: polygon,
    transport: http(polygonRpcUrl()),
  });
}

// The precise viem client type for Polygon reads.
export type PolygonPublicClient = ReturnType<typeof makePublicClient>;

let cachedPublicClient: PolygonPublicClient | null = null;

// Singleton read-only client for Polygon (balances, allowances, code).
export function getPublicClient(): PolygonPublicClient {
  if (!cachedPublicClient) {
    cachedPublicClient = makePublicClient();
  }
  return cachedPublicClient;
}

// Embedded wallet -> ethers v5 JsonRpcSigner, ensuring the wallet is
// on Polygon first (Polymarket settles on chain 137). chainId on the
// abstract EvmWallet is the decimal form (e.g. 137), not Privy's CAIP-2
// string ("eip155:137").
export async function getEthersSigner(
  wallet: EvmWallet,
): Promise<providers.JsonRpcSigner> {
  if (wallet.chainId !== undefined && wallet.chainId !== POLYGON_CHAIN_ID) {
    await wallet.switchChain(POLYGON_CHAIN_ID);
  }
  const provider = await wallet.getEthereumProvider();
  const web3 = new providers.Web3Provider(provider as providers.ExternalProvider);
  return web3.getSigner();
}
