// Attach a market to a post being authored. When the post is rendered
// in the feed, MediaPost/ContentContainer.tsx sees Post.marketId and
// embeds <PostMarketCard /> below the text — the market becomes part
// of the conversation.
//
// Debounced typeahead over /api/markets?q=…&limit=8. The picker only
// stores the market id; the renderer fetches the full details at view
// time so this composer payload stays small.

import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';

import axios from '@src/lib/axios';

type MarketHit = {
  id: string;
  question: string;
  imageUrl: string | null;
  closesAt: string;
};

type Props = {
  value: string | null;
  onChange: (marketId: string | null) => void;
};

function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

function closingIn(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'closed';
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${days}d`;
  const hours = Math.floor(ms / 3_600_000);
  return `${hours}h`;
}

export default function MarketPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<MarketHit | null>(null);
  const debouncedQuery = useDebouncedValue(query, 250);

  // Reset local display state if the parent clears the field.
  useEffect(() => {
    if (value == null) setSelected(null);
  }, [value]);

  const { data: results, isFetching } = useQuery<MarketHit[]>(
    ['markets-search', debouncedQuery],
    async () => {
      const { data } = await axios().get<MarketHit[]>(
        `/markets?q=${encodeURIComponent(debouncedQuery)}&limit=8`,
      );
      return data ?? [];
    },
    {
      enabled: open && debouncedQuery.trim().length >= 2,
      keepPreviousData: true,
    },
  );

  // Edit-mode resolver: when the form opens with a marketId already set
  // (re-editing a post that attached a market) we only have the id —
  // fetch the question + image so the pill can render. The local
  // `selected` (from a fresh pick) takes precedence and skips the fetch.
  const {
    data: fetched,
    isLoading: fetchingExisting,
    isError: fetchError,
  } = useQuery<MarketHit>(
    ['market-by-id', value],
    async () => {
      const { data } = await axios().get<{
        id: string;
        question: string;
        imageUrl: string | null;
        closesAt: string;
      }>(`/markets/${value}`);
      return {
        id: String(data.id),
        question: data.question,
        imageUrl: data.imageUrl,
        closesAt: data.closesAt,
      };
    },
    { enabled: !!value && !selected, staleTime: 60_000 },
  );

  // Only treat `fetched` as the display if it actually matches the
  // current value — react-query keeps the previous result around when
  // `enabled` flips off, which would otherwise flash a stale pill.
  const display: MarketHit | null = value
    ? selected ?? (fetched && fetched.id === value ? fetched : null)
    : null;

  if (display) {
    return (
      <div className="my-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
        {display.imageUrl && (
          <img
            src={display.imageUrl}
            alt=""
            className="h-8 w-8 shrink-0 rounded object-cover"
          />
        )}
        <div className="min-w-0 flex-1 text-sm text-white">
          <div className="truncate">{display.question}</div>
          <div className="text-xs text-white/50">
            closes in {closingIn(display.closesAt)}
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

  // Edit-mode: value set, metadata still loading — show a skeleton so
  // we don't flash the empty "Attach" button before the pill resolves.
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
        + Attach market
      </button>
    );
  }

  const shortQuery = debouncedQuery.trim().length < 2;

  return (
    <div className="my-2 rounded-xl border border-white/10 bg-black/20 p-2">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search markets…"
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm text-white placeholder-white/40 focus:border-white/30 focus:outline-none"
      />
      {!shortQuery && (
        <div className="mt-2 max-h-64 overflow-y-auto">
          {results && results.length > 0 ? (
            results.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setSelected(m);
                  onChange(m.id);
                  setOpen(false);
                  setQuery('');
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-white/5"
              >
                {m.imageUrl && (
                  <img
                    src={m.imageUrl}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-white">
                    {m.question}
                  </div>
                  <div className="text-xs text-white/50">
                    closes in {closingIn(m.closesAt)}
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
