// Attach a Solana spot token to a post being authored. When the post
// is rendered in the feed, MediaPost/ContentContainer.tsx sees
// Post.tokenId and embeds <PostTokenCard /> (an inline Dflow swap card)
// below the text.
//
// Debounced typeahead over /api/tokens?q=…&limit=8. The threshold is
// length >= 1 (looser than the markets picker) because token symbols
// are 3–4 chars — a user typing "S" should already see SOL.
//
// The picker stores only the token id; the renderer fetches the full
// token at view time so the composer payload stays small.

import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';

import axios from '@src/lib/axios';

type TokenHit = {
  id: string;
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string | null;
};

type Props = {
  value: string | null;
  onChange: (tokenId: string | null) => void;
};

function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export default function TokenPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<TokenHit | null>(null);
  const debouncedQuery = useDebouncedValue(query, 250);

  // Reset local display state if the parent clears the field.
  useEffect(() => {
    if (value == null) setSelected(null);
  }, [value]);

  const { data: results, isFetching } = useQuery<TokenHit[]>(
    ['tokens-search', debouncedQuery],
    async () => {
      const { data } = await axios().get<TokenHit[]>(
        `/tokens?q=${encodeURIComponent(debouncedQuery)}&limit=8`,
      );
      return data ?? [];
    },
    {
      // Length-1 threshold — see file header for the reason.
      enabled: open && debouncedQuery.trim().length >= 1,
      keepPreviousData: true,
    },
  );

  // Edit-mode resolver: when the form opens with a tokenId already
  // set (re-editing) we only have the id; fetch the symbol + logo so
  // the pill can render. The local `selected` (from a fresh pick)
  // takes precedence and skips the fetch.
  const {
    data: fetched,
    isLoading: fetchingExisting,
    isError: fetchError,
  } = useQuery<TokenHit>(
    ['token-by-id', value],
    async () => {
      const { data } = await axios().get<TokenHit>(`/tokens/${value}`);
      return data;
    },
    { enabled: !!value && !selected, staleTime: 60_000 },
  );

  const display: TokenHit | null = value
    ? selected ?? (fetched && fetched.id === value ? fetched : null)
    : null;

  if (display) {
    return (
      <div className="my-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        {display.logoURI && (
          <img
            src={display.logoURI}
            alt=""
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
        )}
        <div className="min-w-0 flex-1 text-sm text-white">
          <div className="truncate">
            <span className="font-semibold">{display.symbol}</span>
            <span className="ml-2 text-white/50">{display.name}</span>
          </div>
          <div className="truncate text-xs text-white/40">
            {display.mint.slice(0, 4)}…{display.mint.slice(-4)}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelected(null);
            onChange(null);
          }}
          className="rounded-lg px-2 py-1 text-xs text-white/60 hover:bg-white/10 hover:text-white"
        >
          Remove
        </button>
      </div>
    );
  }

  if (value && fetchingExisting && !fetchError) {
    return (
      <div className="my-2 h-12 animate-pulse rounded-xl border border-white/10 bg-white/5" />
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="my-2 rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-white/70 hover:border-white/20 hover:text-white"
      >
        + Attach token
      </button>
    );
  }

  const shortQuery = debouncedQuery.trim().length < 1;

  return (
    <div className="my-2 rounded-xl border border-white/10 bg-black/20 p-2">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tokens — SOL, WIF, BONK…"
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
      />
      {!shortQuery && (
        <div className="mt-2 max-h-64 overflow-y-auto">
          {results && results.length > 0 ? (
            results.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelected(t);
                  onChange(t.id);
                  setOpen(false);
                  setQuery('');
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-white/5"
              >
                {t.logoURI && (
                  <img
                    src={t.logoURI}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-white">
                    <span className="font-semibold">{t.symbol}</span>
                    <span className="ml-2 text-white/50">{t.name}</span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-2 py-3 text-sm text-white/50">
              {isFetching ? 'Searching…' : 'No matches.'}
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setQuery('');
        }}
        className="mt-2 text-xs text-white/50 hover:text-white/70"
      >
        Cancel
      </button>
    </div>
  );
}
