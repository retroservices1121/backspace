// Reads SOL + SPL token balances for a given Solana address via the
// configured RPC. Client-side — the Solana chain itself is the source
// of truth, no Backspace server needed.
//
// Token metadata (symbol, logo) is joined from our Token catalog so
// each row renders without the user having to recognize a raw mint
// address. Mints not in the catalog still appear, just with mint as
// the label.

import { useQuery } from 'react-query';

import axios from '@src/lib/axios';
import { solanaRpcUrl } from '@src/lib/dflow';

const PUBLIC_MAINNET_RPC = 'https://api.mainnet-beta.solana.com';
// Solana's SPL Token program id (the legacy/SPL one — not Token2022).
// Most user balances live under this owner.
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

export type SolanaBalance = {
  /** Mint address; 'SOL' for native SOL. */
  mint: string;
  /** Atomic amount as string (u64-safe). */
  rawAmount: string;
  /** Human-decimal amount. */
  uiAmount: number;
  decimals: number;
  symbol: string | null;
  name: string | null;
  logoURI: string | null;
};

type CatalogToken = {
  id: string;
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string | null;
};

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const url = solanaRpcUrl() ?? PUBLIC_MAINNET_RPC;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`Solana RPC ${method} HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) {
    throw new Error(`Solana RPC ${method}: ${json.error.message ?? 'unknown'}`);
  }
  return json.result as T;
}

async function fetchBalances(owner: string): Promise<SolanaBalance[]> {
  // Native SOL balance (lamports) + SPL token accounts owned by the
  // user. Two RPC calls in parallel — cheaper than getProgramAccounts.
  const [lamports, tokenAccounts] = await Promise.all([
    rpc<number>('getBalance', [owner, { commitment: 'confirmed' }]),
    rpc<{
      value: Array<{
        account: {
          data: {
            parsed: {
              info: {
                mint: string;
                tokenAmount: {
                  amount: string;
                  decimals: number;
                  uiAmount: number;
                };
              };
            };
          };
        };
      }>;
    }>('getTokenAccountsByOwner', [
      owner,
      { programId: TOKEN_PROGRAM_ID },
      { encoding: 'jsonParsed', commitment: 'confirmed' },
    ]),
  ]);

  const balances: SolanaBalance[] = [];
  if (lamports > 0) {
    balances.push({
      mint: 'SOL',
      rawAmount: String(lamports),
      uiAmount: lamports / 1e9,
      decimals: 9,
      symbol: 'SOL',
      name: 'Solana',
      logoURI: null,
    });
  }
  for (const acc of tokenAccounts.value ?? []) {
    const info = acc.account.data.parsed.info;
    // Hide dust / fully-empty token accounts.
    if (!info.tokenAmount.uiAmount || info.tokenAmount.uiAmount <= 0) continue;
    balances.push({
      mint: info.mint,
      rawAmount: info.tokenAmount.amount,
      uiAmount: info.tokenAmount.uiAmount,
      decimals: info.tokenAmount.decimals,
      symbol: null,
      name: null,
      logoURI: null,
    });
  }

  // Join with our Token catalog to fill in symbol/name/logo for the
  // SPL rows. /api/tokens is paginated (max 200) so for users with
  // wallets full of obscure tokens we'd need a bulk-by-mint endpoint;
  // for now everything within the curated catalog is well under that.
  try {
    const { data } = await axios().get<CatalogToken[]>('/tokens?limit=200');
    const byMint = new Map(data.map((t) => [t.mint, t]));
    for (const b of balances) {
      const meta = byMint.get(b.mint);
      if (meta) {
        b.symbol = meta.symbol;
        b.name = meta.name;
        b.logoURI = meta.logoURI;
      }
    }
  } catch {
    // Metadata enrichment is best-effort; raw mints + amounts are
    // still useful on their own.
  }

  // Sort: SOL first, then by uiAmount desc.
  balances.sort((a, b) => {
    if (a.mint === 'SOL') return -1;
    if (b.mint === 'SOL') return 1;
    return b.uiAmount - a.uiAmount;
  });
  return balances;
}

export function useSolanaBalances(owner: string | null | undefined) {
  return useQuery(
    ['solana-balances', owner],
    () => fetchBalances(owner as string),
    {
      enabled: !!owner,
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
    },
  );
}
