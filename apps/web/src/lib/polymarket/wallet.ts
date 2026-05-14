// Wallet plumbing for the Polymarket trade path.
//
// Privy provisions a non-custodial EOA embedded wallet. clob-client-v2
// and builder-relayer-client both accept an ethers v5 signer, so we
// adapt the Privy EIP-1193 provider into one. A read-only viem
// publicClient handles balance/allowance reads.
import { providers } from 'ethers';
import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';

import { POLYGON_CHAIN_ID, polygonRpcUrl } from './config';

// Minimal shape we need from a Privy ConnectedWallet — avoids a hard
// type dependency on the Privy version's exact ConnectedWallet type.
export type PrivyWalletLike = {
  address: string;
  chainId?: string;
  getEthereumProvider: () => Promise<unknown>;
  switchChain: (chainId: number) => Promise<void>;
};

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

// Privy embedded wallet -> ethers v5 JsonRpcSigner, ensuring the wallet
// is on Polygon first (Polymarket settles on chain 137).
export async function getEthersSigner(
  wallet: PrivyWalletLike,
): Promise<providers.JsonRpcSigner> {
  if (wallet.chainId && wallet.chainId !== `eip155:${POLYGON_CHAIN_ID}`) {
    await wallet.switchChain(POLYGON_CHAIN_ID);
  }
  const provider = await wallet.getEthereumProvider();
  const web3 = new providers.Web3Provider(provider as providers.ExternalProvider);
  return web3.getSigner();
}
