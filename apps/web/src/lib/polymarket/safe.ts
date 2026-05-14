// Gnosis Safe proxy wallet. Polymarket trading runs through a Safe
// (the "funder" that holds pUSD + outcome tokens), deterministically
// derived from the user's Privy EOA and deployed once via the gasless
// Relayer. signatureType 2 on the CLOB client ties the EOA signer to
// this Safe.
import {
  deriveSafe,
  type RelayClient,
} from '@polymarket/builder-relayer-client';

import { relayerContracts } from './contracts';
import type { PolygonPublicClient } from './wallet';

// Deterministic — the same EOA always maps to the same Safe address,
// so the funding UI can show a deposit address before anything is
// deployed.
export function deriveSafeAddress(eoaAddress: string): string {
  return deriveSafe(
    eoaAddress,
    relayerContracts().SafeContracts.SafeFactory,
  );
}

// Relayer's /deployed check, with an on-chain code() fallback.
export async function isSafeDeployed(
  relayClient: RelayClient,
  safeAddress: string,
  publicClient: PolygonPublicClient,
): Promise<boolean> {
  try {
    return await relayClient.getDeployed(safeAddress);
  } catch {
    const code = await publicClient.getCode({
      address: safeAddress as `0x${string}`,
    });
    return !!code && code !== '0x';
  }
}

// Deploys the Safe via the gasless Relayer. Prompts the user for one
// Privy signature; the Relayer covers gas. Returns the Safe address.
export async function deploySafe(relayClient: RelayClient): Promise<string> {
  const response = await relayClient.deploy();
  const result = await response.wait();
  if (!result?.proxyAddress) {
    throw new Error('Safe deployment did not confirm');
  }
  return result.proxyAddress;
}
