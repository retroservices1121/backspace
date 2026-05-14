// Collateral balance reads. On CLOB V2 the trading currency is pUSD
// (USDC-backed ERC-20, 6 decimals). The user funds their Safe by
// sending USDC on Polygon, which wraps to pUSD — so the Safe's pUSD
// balance is the tradable balance the funding UI shows.
import { erc20Abi, formatUnits } from 'viem';

import { clobContracts } from './contracts';
import { getPublicClient } from './wallet';

const COLLATERAL_DECIMALS = 6;

export type CollateralBalance = {
  raw: bigint;
  formatted: string;
};

export async function getCollateralBalance(
  address: string,
): Promise<CollateralBalance> {
  const publicClient = getPublicClient();
  const collateral = clobContracts().collateral as `0x${string}`;
  // Param cast: viem's readContract generics need TS >= 5.0.4
  // (abitype); apps/web is on 4.9.5. Runtime call is correct.
  const raw = (await publicClient.readContract({
    address: collateral,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
  } as never)) as bigint;
  return { raw, formatted: formatUnits(raw, COLLATERAL_DECIMALS) };
}
