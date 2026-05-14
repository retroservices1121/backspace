// Token approvals the Safe must grant before it can trade. pUSD (the
// V2 collateral, ERC-20) is approved for the contracts that pull
// funds; the CTF outcome tokens (ERC-1155) are approved via
// setApprovalForAll for the exchanges. All set in one gasless batch
// through the Relayer — one signature for the user.
//
// Adapted from Polymarket's V1 privy-safe example to CLOB V2 contract
// addresses (sourced from clob-client-v2's getContractConfig). The
// exact V2 spender set is best-effort and should be confirmed against
// a live deploy.
import {
  OperationType,
  type RelayClient,
  type SafeTransaction,
} from '@polymarket/builder-relayer-client';
import { encodeFunctionData, erc20Abi } from 'viem';

import { clobContracts } from './contracts';
import { getPublicClient } from './wallet';

// BigInt literals (123n) aren't available at this tsconfig target, so
// these go through the BigInt() constructor.
const MAX_UINT256 = BigInt(
  '115792089237316195423570985008687907853269984665640564039457584007913129639935',
);
// "Approved" threshold for the allowance check — well above any
// realistic single order, well below MAX_UINT256.
const APPROVAL_THRESHOLD = BigInt('1000000000000');

const erc1155Abi = [
  {
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

type Addr = `0x${string}`;

function spenderSet() {
  const c = clobContracts();
  return {
    collateral: c.collateral as Addr, // pUSD
    ctf: c.conditionalTokens as Addr,
    // pUSD (ERC-20) spenders.
    erc20Spenders: [
      c.conditionalTokens,
      c.negRiskAdapter,
      c.exchangeV2,
      c.negRiskExchangeV2,
    ] as Addr[],
    // CTF outcome-token (ERC-1155) operators.
    erc1155Operators: [
      c.exchangeV2,
      c.negRiskExchangeV2,
      c.negRiskAdapter,
    ] as Addr[],
  };
}

// True only if every required approval is already in place on-chain.
export async function checkApprovals(safeAddress: string): Promise<boolean> {
  const { collateral, ctf, erc20Spenders, erc1155Operators } = spenderSet();
  const publicClient = getPublicClient();
  const safe = safeAddress as Addr;

  // viem's readContract generics need TS >= 5.0.4 (abitype); apps/web
  // is on 4.9.5, so the param object is cast. The ABIs + function
  // names are correct — this is a typings-engine limitation, not a
  // runtime issue.
  const erc20Ok = await Promise.all(
    erc20Spenders.map((spender) =>
      publicClient
        .readContract({
          address: collateral,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [safe, spender],
        } as never)
        .then((allowance) => (allowance as bigint) >= APPROVAL_THRESHOLD)
        .catch(() => false),
    ),
  );
  const erc1155Ok = await Promise.all(
    erc1155Operators.map((operator) =>
      publicClient
        .readContract({
          address: ctf,
          abi: erc1155Abi,
          functionName: 'isApprovedForAll',
          args: [safe, operator],
        } as never)
        .then((v) => Boolean(v))
        .catch(() => false),
    ),
  );
  return erc20Ok.every(Boolean) && erc1155Ok.every(Boolean);
}

function buildApprovalTxs(): SafeTransaction[] {
  const { collateral, ctf, erc20Spenders, erc1155Operators } = spenderSet();
  const txs: SafeTransaction[] = [];

  for (const spender of erc20Spenders) {
    txs.push({
      to: collateral,
      operation: OperationType.Call,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, MAX_UINT256],
      }),
      value: '0',
    });
  }
  for (const operator of erc1155Operators) {
    txs.push({
      to: ctf,
      operation: OperationType.Call,
      data: encodeFunctionData({
        abi: erc1155Abi,
        functionName: 'setApprovalForAll',
        args: [operator, true],
      }),
      value: '0',
    });
  }
  return txs;
}

// Sets every approval in one gasless Relayer batch.
export async function setApprovals(relayClient: RelayClient): Promise<void> {
  const response = await relayClient.execute(
    buildApprovalTxs(),
    'Backspace: enable Polymarket trading',
  );
  await response.wait();
}
