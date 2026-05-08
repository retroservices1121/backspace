// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';
import { MarketCardData } from '@src/components/Market/MarketCard';
import {
  fetchMarkets as sliceFetchMarkets,
  fetchPosts as sliceFetchPosts,
  FilterOptions,
  setFilter as updateFilter,
} from '@src/store/feedSlice';
import { RootState, useAppDispatch, useAppSelector } from '@src/store/store';

import { Post } from 'types/prisma';

export const useFeed = () => {
  const dispatch = useAppDispatch();
  const { posts: allPosts, markets, filter } = useAppSelector(
    (state: RootState) => state.feed,
  );
  const [posts, setPosts] = useState<Post[]>(allPosts[filter]);

  // MARKETS filter doesn't go through state.posts — it pulls the
  // catalog snapshot directly into state.markets via /api/markets.
  const fetchPosts = (newFilter?: FilterOptions) => {
    const target = newFilter || filter;
    if (target === FilterOptions.MARKETS) {
      return dispatch(sliceFetchMarkets());
    }
    return dispatch(sliceFetchPosts(target));
  };

  const setFilter = async (newFilter: FilterOptions) => {
    await dispatch(updateFilter(newFilter));
    fetchPosts(newFilter);
  };

  useEffect(() => {
    setPosts(allPosts[filter]);
  }, [filter, allPosts]);

  return {
    posts,
    markets: markets as MarketCardData[],
    filter,
    fetchPosts,
    setFilter,
  };
};
