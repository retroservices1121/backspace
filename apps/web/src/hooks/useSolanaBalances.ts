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
  // Note: getBalance returns { context, value }, NOT a bare number —
  // an earlier version of this code treated the whole result as the
  // lamports count, which made every non-zero SOL balance render as
  // "0" because comparing the object to 0 is always false.
  const [balanceResult, tokenAccounts] = await Promise.all([
    rpc<{ context: { slot: number }; value: number }>(
      'getBalance',
      [owner, { commitment: 'confirmed' }],
    ),
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

  const lamports = balanceResult?.value ?? 0;
  const balances: SolanaBalance[] = [];
  if (lamports > 0) {
    balances.push({
      mint: 'SOL',
      rawAmount: String(lamports),
      uiAmount: lamports / 1e9,
      decimals: 9,
      symbol: 'SOL',
      name: 'Solana',
      // Canonical Solana mint logo from the official token list.
      logoURI:
        'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
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

  // Two-step metadata enrichment:
  //  (1) Our Token catalog — covers Jupiter-verified mints we've
  //      imported. Cheapest path; one network call.
  //  (2) Jupiter's per-mint endpoint as a fallback for anything we
  //      don't have. The catalog is intentionally narrow (anti-spam
  //      for the token picker) but portfolio should show whatever
  //      the user actually holds, even off-catalog tokens.
  //      Lite host is public + CORS-friendly; no API key needed.
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
    // Catalog enrichment is best-effort; raw mints + amounts are
    // still useful on their own.
  }

  // Step 2: Jupiter fallback for anything still unresolved (excluding
  // native SOL, which never has a mint to look up). Parallel fetches
  // with short timeouts so the portfolio doesn't hang on Jupiter
  // hiccups.
  const unresolved = balances.filter(
    (b) => b.mint !== 'SOL' && !b.symbol,
  );
  if (unresolved.length > 0) {
    await Promise.all(
      unresolved.map(async (b) => {
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 3000);
          const res = await fetch(
            `https://lite-api.jup.ag/tokens/v2/search?query=${b.mint}`,
            { signal: ctrl.signal },
          );
          clearTimeout(timer);
          if (!res.ok) return;
          const arr = (await res.json()) as Array<{
            id?: string;
            symbol?: string;
            name?: string;
            icon?: string;
            logoURI?: string;
          }>;
          const hit = Array.isArray(arr)
            ? arr.find((t) => t.id === b.mint) ?? arr[0]
            : null;
          if (hit) {
            b.symbol = hit.symbol ?? b.symbol;
            b.name = hit.name ?? b.name;
            b.logoURI = hit.icon ?? hit.logoURI ?? b.logoURI;
          }
        } catch {
          // Jupiter fallback is also best-effort — leave the mint as-is.
        }
      }),
    );
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
