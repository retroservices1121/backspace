// /markets — standalone markets catalog page (the URL the LeftNav
// 'Markets' item points at). Reuses the same /api/markets data and
// CatalogMarketCard rendering as the home feed's Markets tab.
//
// Filter affordance: TopTabs across available categories, derived
// from the fetched catalog. 'All' is always present; the other tabs
// only show up once the data lands so we don't render placeholder
// categories that the catalog doesn't actually have.

import React, { useEffect, useMemo, useState } from 'react';
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

async function fetchMarkets(): Promise<MarketCardData[]> {
  const { data } = await axios().get<MarketCardData[]>('/markets?limit=100');
  return data ?? [];
}

const Discover: React.FC = () => {
  const authState = useAuthentication();
  const dispatch = useAppDispatch();
  const [active, setActive] = useState<string>(ALL);

  useEffect(() => {
    dispatch(setPageTitle('Markets'));
  }, []);

  const markets = useQuery(
    ['discover-markets'],
    fetchMarkets,
    {
      enabled: authState === AuthStatus.SignedIn,
      refetchInterval: 60_000,
      staleTime: 30_000,
    },
  );

  // Categories present in the loaded catalog. Lowercase keys so the
  // tab compare is stable; render the original casing.
  const categories = useMemo(() => {
    if (!markets.data) return [] as Array<{ key: string; label: string }>;
    const seen = new Map<string, string>();
    for (const m of markets.data) {
      if (m.category) {
        const key = m.category.toLowerCase();
        if (!seen.has(key)) seen.set(key, m.category);
      }
    }
    return Array.from(seen, ([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [markets.data]);

  const tabs = useMemo(
    () => [{ key: ALL, label: 'All' }, ...categories],
    [categories],
  );

  const visible = useMemo(() => {
    if (!markets.data) return [];
    if (active === ALL) return markets.data;
    return markets.data.filter((m) => (m.category ?? '').toLowerCase() === active);
  }, [markets.data, active]);

  return (
    <>
      <div className="hidden sm:block">
        <TopTabs
          title="Markets"
          tabs={tabs}
          active={active}
          onChange={setActive}
        />
      </div>

      <div className="font-display text-ink">
        {authState !== AuthStatus.SignedIn ? (
          <EmptyState text="Sign in to browse markets." />
        ) : markets.isLoading ? (
          <SkeletonLoader renderCount={8} />
        ) : visible.length > 0 ? (
          visible.map((m) => (
            <CatalogMarketCard key={`${m.venue}:${m.externalId}`} market={m} />
          ))
        ) : (
          <EmptyState
            title={
              active === ALL
                ? 'No active markets'
                : 'No markets in this category yet'
            }
            text={
              active === ALL
                ? 'Check back soon — the catalog refreshes on a cron.'
                : 'Try another category.'
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

export default Discover;
