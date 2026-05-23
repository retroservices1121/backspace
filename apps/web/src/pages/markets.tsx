// /markets — Discover-style market catalog page.
//
// Layout:
//   1. Sticky TopTabs header (title only)
//   2. Trending horizontal scroller — top markets by 24h volume,
//      always shown regardless of selected sort or category
//   3. Sticky filter bar — category dropdown + sort dropdown + search
//   4. Polymarket-style responsive grid of MarketGridCard tiles
//      (1 col mobile → 2 → 3 → 4 across breakpoints).
//
// Two card shapes for two contexts:
//   - TrendingMarketCard (image-overlay, horizontal scroll)
//   - MarketGridCard (vertical tile, click-through to /m/[id])
// Neither does inline trading — trading happens on the detail page
// or on inline post embeds. The catalog is a discover surface.
//
// The page is rendered without the shell's RightRail (see
// NavigationV2/Navigation.tsx's wideLayout check), so the content
// can span the full 1320px shell.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';

import axios from '@src/lib/axios';
import useAuthentication from '@src/hooks/useAuthenticate';
import { AuthStatus } from '@src/store/authSlice';
import { setPageTitle } from '@src/store/appSlice';
import { useAppDispatch } from '@src/store/store';

import { MarketGridCard } from '@src/components/Market/MarketGridCard';
import { TrendingMarketCard } from '@src/components/Market/TrendingMarketCard';
import type { MarketCardData } from '@src/components/Market/MarketCard';
import TopTabs from 'components/Shell/TopTabs';

const ALL = 'all';
const SEARCH_MIN = 2;
const TRENDING_COUNT = 6;

type SortKey = 'trending' | 'volume' | 'volume_asc' | 'closing';

const SORTS: Array<{ key: SortKey; label: string; sub: string }> = [
  { key: 'trending',   label: 'Trending',         sub: 'Highest 24h volume' },
  { key: 'volume',     label: 'High volume',      sub: 'Most traded all-time' },
  { key: 'volume_asc', label: 'Low volume',       sub: 'Find under-the-radar markets' },
  { key: 'closing',    label: 'Soonest closing',  sub: 'Resolving first' },
];

async function fetchCatalog(sort: SortKey): Promise<MarketCardData[]> {
  const { data } = await axios().get<MarketCardData[]>(
    `/markets?limit=100&sort=${sort}`,
  );
  return data ?? [];
}

async function fetchTrending(): Promise<MarketCardData[]> {
  const { data } = await axios().get<MarketCardData[]>(
    `/markets?limit=${TRENDING_COUNT}&sort=trending`,
  );
  return data ?? [];
}

async function fetchSearch(q: string): Promise<MarketCardData[]> {
  const { data } = await axios().get<MarketCardData[]>(
    `/markets?q=${encodeURIComponent(q)}&limit=50`,
  );
  return data ?? [];
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

const Markets: React.FC = () => {
  const authState = useAuthentication();
  const dispatch = useAppDispatch();
  const [category, setCategory] = useState<string>(ALL);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>('trending');
  const [sortOpen, setSortOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounced(query.trim(), 250);
  const categoryRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(setPageTitle('Markets'));
  }, []);

  // Both dropdowns close on outside click.
  useEffect(() => {
    if (!sortOpen && !categoryOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (sortOpen && sortRef.current && !sortRef.current.contains(t)) setSortOpen(false);
      if (categoryOpen && categoryRef.current && !categoryRef.current.contains(t)) setCategoryOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [sortOpen, categoryOpen]);

  const catalog = useQuery(
    ['markets-catalog', sort],
    () => fetchCatalog(sort),
    {
      enabled: authState === AuthStatus.SignedIn,
      refetchInterval: 60_000,
      staleTime: 30_000,
      keepPreviousData: true,
    },
  );

  const trending = useQuery(
    ['markets-trending'],
    fetchTrending,
    {
      enabled: authState === AuthStatus.SignedIn,
      refetchInterval: 60_000,
      staleTime: 30_000,
    },
  );

  const search = useQuery(
    ['markets-search', debouncedQuery],
    () => fetchSearch(debouncedQuery),
    {
      enabled:
        authState === AuthStatus.SignedIn && debouncedQuery.length >= SEARCH_MIN,
      keepPreviousData: true,
    },
  );

  // Categories derived from the loaded catalog. All first, then
  // alphabetical so the dropdown is predictable.
  const categories = useMemo(() => {
    if (!catalog.data) return [{ key: ALL, label: 'All categories' }];
    const seen = new Map<string, string>();
    for (const m of catalog.data) {
      if (m.category) {
        const key = m.category.toLowerCase();
        if (!seen.has(key)) seen.set(key, m.category);
      }
    }
    return [
      { key: ALL, label: 'All categories' },
      ...Array.from(seen, ([key, label]) => ({ key, label })).sort((a, b) =>
        a.label.localeCompare(b.label),
      ),
    ];
  }, [catalog.data]);

  const isSearching = debouncedQuery.length >= SEARCH_MIN;

  const visible = useMemo(() => {
    if (isSearching) return search.data ?? [];
    if (!catalog.data) return [];
    if (category === ALL) return catalog.data;
    return catalog.data.filter(
      (m) => (m.category ?? '').toLowerCase() === category,
    );
  }, [isSearching, search.data, catalog.data, category]);

  const activeSortLabel = SORTS.find((s) => s.key === sort)?.label ?? 'Trending';
  const activeCategoryLabel =
    categories.find((c) => c.key === category)?.label ?? 'All categories';

  return (
    <>
      <div className="hidden sm:block">
        <TopTabs title="Markets" tabs={[]} active="" onChange={() => undefined} />
      </div>

      {authState !== AuthStatus.SignedIn ? (
        <EmptyState text="Sign in to browse markets." />
      ) : (
        <>
          {/* Trending hero row — only shown when not searching. */}
          {!isSearching && (
            <section className="px-6 pt-5 pb-2">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="m-0 text-[15px] font-bold tracking-[-0.01em] text-ink">
                  Trending now
                </h2>
                <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-ink-3">
                  Top by 24h volume
                </span>
              </div>
              <div
                className="
                  flex gap-3 overflow-x-auto pb-2 -mx-6 px-6
                  snap-x snap-mandatory scroll-px-6
                  [&::-webkit-scrollbar]:h-1.5
                  [&::-webkit-scrollbar-thumb]:bg-white/10
                  [&::-webkit-scrollbar-thumb]:rounded-full
                  [&::-webkit-scrollbar-track]:bg-transparent
                "
              >
                {trending.isLoading && trending.data == null
                  ? Array.from({ length: TRENDING_COUNT }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-none w-[260px] h-[160px] rounded-[16px] border border-line bg-surface animate-pulse"
                    />
                  ))
                  : (trending.data ?? []).map((m) => (
                    <div key={`${m.venue}:${m.externalId}`} className="snap-start">
                      <TrendingMarketCard market={m} />
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Filter bar — category dropdown + sort dropdown + search.
              Sticky just under TopTabs so it stays reachable while the
              grid scrolls. */}
          <div
            className="
              sticky top-[64px] z-[5]
              border-b border-line
              bg-canvas/[0.78] backdrop-blur-[14px] backdrop-saturate-[160%]
            "
          >
            <div className="px-6 pt-3 pb-2 flex items-center gap-3 flex-wrap">
              {/* Category dropdown */}
              <div className="relative flex-none" ref={categoryRef}>
                <button
                  type="button"
                  onClick={() => { setCategoryOpen((v) => !v); setSortOpen(false); }}
                  className="
                    inline-flex items-center gap-2 px-3 h-8 rounded-full
                    border border-line bg-surface text-ink text-[13px] font-medium
                    hover:border-brand-2/50 transition-colors duration-150
                  "
                >
                  <span className="text-ink-3 text-[11px] font-mono">Category</span>
                  <span>{activeCategoryLabel}</span>
                  <svg
                    viewBox="0 0 24 24" width="12" height="12"
                    fill="none" stroke="currentColor" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {categoryOpen && (
                  <div
                    className="
                      absolute left-0 z-20 mt-1 w-[260px] max-h-[60vh] overflow-y-auto
                      rounded-[12px] border border-line bg-surface
                      shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] p-1.5
                    "
                  >
                    {categories.map((c) => {
                      const isActive = c.key === category;
                      return (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => { setCategory(c.key); setCategoryOpen(false); }}
                          className={[
                            'w-full text-left px-2.5 py-2 rounded-[8px]',
                            'transition-colors duration-150',
                            isActive ? 'bg-brand-soft' : 'hover:bg-hover',
                          ].join(' ')}
                        >
                          <div
                            className={[
                              'text-[13px] font-semibold',
                              isActive ? 'text-brand-2' : 'text-ink',
                            ].join(' ')}
                          >
                            {c.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sort dropdown */}
              <div className="relative flex-none" ref={sortRef}>
                <button
                  type="button"
                  onClick={() => { setSortOpen((v) => !v); setCategoryOpen(false); }}
                  className="
                    inline-flex items-center gap-2 px-3 h-8 rounded-full
                    border border-line bg-surface text-ink text-[13px] font-medium
                    hover:border-brand-2/50 transition-colors duration-150
                  "
                >
                  <span className="text-ink-3 text-[11px] font-mono">Sort</span>
                  <span>{activeSortLabel}</span>
                  <svg
                    viewBox="0 0 24 24" width="12" height="12"
                    fill="none" stroke="currentColor" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {sortOpen && (
                  <div
                    className="
                      absolute left-0 z-20 mt-1 w-[260px]
                      rounded-[12px] border border-line bg-surface
                      shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] p-1.5
                    "
                  >
                    {SORTS.map((s) => {
                      const isActive = s.key === sort;
                      return (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => { setSort(s.key); setSortOpen(false); }}
                          className={[
                            'w-full text-left px-2.5 py-2 rounded-[8px]',
                            'transition-colors duration-150',
                            isActive ? 'bg-brand-soft' : 'hover:bg-hover',
                          ].join(' ')}
                        >
                          <div
                            className={[
                              'text-[13px] font-semibold',
                              isActive ? 'text-brand-2' : 'text-ink',
                            ].join(' ')}
                          >
                            {s.label}
                          </div>
                          <div className="text-[11px] font-mono text-ink-3">
                            {s.sub}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 pb-3">
              <div className="relative">
                <svg
                  viewBox="0 0 24 24"
                  width="16" height="16"
                  fill="none" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search markets not in this list…"
                  style={{ background: 'transparent' }}
                  className="
                    w-full h-10 pl-10 pr-4 rounded-full
                    border border-line text-[14px] text-ink placeholder:text-ink-3
                    outline-none focus:border-brand-2
                    transition-colors duration-150 font-display
                  "
                />
              </div>
            </div>
          </div>

          {/* Main grid — responsive: 1 / 2 / 3 / 4 columns. Polymarket
              hits 3-up at desktop; we keep going to 4 at xl since the
              shell can stretch to 1320px without the right rail. */}
          <div className="px-6 py-5 font-display text-ink">
            {isSearching ? (
              search.isLoading ? (
                <GridSkeleton count={6} />
              ) : visible.length > 0 ? (
                <Grid>
                  {visible.map((m) => (
                    <MarketGridCard
                      key={`${m.venue}:${m.externalId}`}
                      market={m}
                    />
                  ))}
                </Grid>
              ) : (
                <EmptyState
                  title="No matches"
                  text={`Nothing matched "${debouncedQuery}". Try a different keyword.`}
                />
              )
            ) : catalog.isLoading ? (
              <GridSkeleton count={9} />
            ) : visible.length > 0 ? (
              <Grid>
                {visible.map((m) => (
                  <MarketGridCard
                    key={`${m.venue}:${m.externalId}`}
                    market={m}
                  />
                ))}
              </Grid>
            ) : (
              <EmptyState
                title={
                  category === ALL
                    ? 'No active markets'
                    : 'No markets in this category yet'
                }
                text={
                  category === ALL
                    ? 'Check back soon — the catalog refreshes on a cron.'
                    : 'Try another category, or search above.'
                }
              />
            )}
          </div>
        </>
      )}
    </>
  );
};

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="
        grid gap-4
        grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
      "
    >
      {children}
    </div>
  );
}

function GridSkeleton({ count }: { count: number }) {
  return (
    <Grid>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-[16px] border border-line bg-surface animate-pulse"
          style={{ paddingTop: '125%' }}
        />
      ))}
    </Grid>
  );
}

function EmptyState({ title, text }: { title?: string; text: string }) {
  return (
    <div className="px-6 py-12 max-w-md mx-auto text-center">
      {title && (
        <h2 className="m-0 text-[20px] font-bold tracking-[-0.02em] text-ink">
          {title}
        </h2>
      )}
      <p className="mt-2 text-[14px] text-ink-2 leading-snug">{text}</p>
    </div>
  );
}

export default Markets;
