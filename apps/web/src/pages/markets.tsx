// /markets — standalone markets catalog page (the URL the LeftNav
// 'Markets' item points at). Reuses /api/markets and CatalogMarketCard.
//
// Sort options: passed through to /api/markets?sort=. 'trending' is
// volume24hr desc (what's hot now); 'volume' / 'volume_asc' are total
// volume desc/asc; 'closing' is closesAt asc (the original default).
// Volume snapshots come from the Polymarket Gamma import.
//
// Filter affordance: category dropdown (derived from categories
// actually present in the loaded catalog) + a free-text search box.
// When the search box has ≥2 chars we ignore the category and ask
// the API for a substring match (/api/markets?q=...), so users can
// jump to a market that isn't in the loaded window.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';

import axios from '@src/lib/axios';
import useAuthentication from '@src/hooks/useAuthenticate';
import { AuthStatus } from '@src/store/authSlice';
import { setPageTitle } from '@src/store/appSlice';
import { useAppDispatch } from '@src/store/store';

import { CatalogMarketCard } from '@src/components/Market/CatalogMarketCard';
import type { MarketCardData } from '@src/components/Market/MarketCard';
import SkeletonLoader from 'components/MediaPost/SkeletonLoader';
import TopTabs from 'components/Shell/TopTabs';

const ALL = 'all';
const SEARCH_MIN = 2;

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
  const [catOpen, setCatOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>('trending');
  const [sortOpen, setSortOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounced(query.trim(), 250);
  const catRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(setPageTitle('Markets'));
  }, []);

  // Close the dropdowns on outside click. One handler watches both
  // refs so a click into the other popover doesn't bounce.
  useEffect(() => {
    if (!catOpen && !sortOpen) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (catOpen && catRef.current && !catRef.current.contains(t)) {
        setCatOpen(false);
      }
      if (sortOpen && sortRef.current && !sortRef.current.contains(t)) {
        setSortOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [catOpen, sortOpen]);

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

  const search = useQuery(
    ['markets-search', debouncedQuery],
    () => fetchSearch(debouncedQuery),
    {
      enabled:
        authState === AuthStatus.SignedIn && debouncedQuery.length >= SEARCH_MIN,
      keepPreviousData: true,
    },
  );

  // Categories derived from the loaded catalog. Lowercase keys so the
  // compare is stable; original casing kept for display.
  const categories = useMemo(() => {
    if (!catalog.data) return [] as Array<{ key: string; label: string }>;
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

  const activeCatLabel =
    categories.find((c) => c.key === category)?.label ?? 'All categories';
  const activeSortLabel = SORTS.find((s) => s.key === sort)?.label ?? 'Trending';

  return (
    <>
      <div className="hidden sm:block">
        <TopTabs title="Markets" tabs={[]} active="" onChange={() => undefined} />
      </div>

      {/* Filter bar — category dropdown + search. Sticky just under
          the TopTabs header so the controls stay reachable while the
          catalog scrolls. */}
      <div
        className="
          sticky top-[64px] z-[5]
          px-6 py-3 border-b border-line
          bg-canvas/[0.78] backdrop-blur-[14px] backdrop-saturate-[160%]
          flex flex-col gap-2.5
        "
      >
        <div className="flex items-center gap-2">
          <div className="relative" ref={catRef}>
            <button
              type="button"
              onClick={() => setCatOpen((v) => !v)}
              className="
                inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                border border-line bg-surface text-ink text-[13px] font-medium
                hover:border-brand-2/50 transition-colors duration-150
              "
            >
              <span>{activeCatLabel}</span>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {catOpen && (
              <div
                className="
                  absolute z-20 mt-1 w-[240px] max-h-[320px] overflow-y-auto
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
                      onClick={() => {
                        setCategory(c.key);
                        setCatOpen(false);
                      }}
                      className={[
                        'w-full text-left px-2.5 py-2 rounded-[8px]',
                        'text-[13px] transition-colors duration-150',
                        isActive
                          ? 'bg-brand-soft text-brand-2 font-semibold'
                          : 'text-ink hover:bg-hover',
                      ].join(' ')}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              className="
                inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                border border-line bg-surface text-ink text-[13px] font-medium
                hover:border-brand-2/50 transition-colors duration-150
              "
            >
              <span className="text-ink-3 text-[11px] font-mono">Sort:</span>
              <span>{activeSortLabel}</span>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {sortOpen && (
              <div
                className="
                  absolute z-20 mt-1 w-[260px]
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
                      onClick={() => {
                        setSort(s.key);
                        setSortOpen(false);
                      }}
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

      <div className="font-display text-ink">
        {authState !== AuthStatus.SignedIn ? (
          <EmptyState text="Sign in to browse markets." />
        ) : isSearching ? (
          search.isLoading ? (
            <SkeletonLoader renderCount={4} />
          ) : visible.length > 0 ? (
            visible.map((m) => (
              <CatalogMarketCard
                key={`${m.venue}:${m.externalId}`}
                market={m}
              />
            ))
          ) : (
            <EmptyState
              title="No matches"
              text={`Nothing matched "${debouncedQuery}". Try a different keyword.`}
            />
          )
        ) : catalog.isLoading ? (
          <SkeletonLoader renderCount={8} />
        ) : visible.length > 0 ? (
          visible.map((m) => (
            <CatalogMarketCard key={`${m.venue}:${m.externalId}`} market={m} />
          ))
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
  );
};

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
