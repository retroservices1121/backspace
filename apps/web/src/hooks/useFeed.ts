// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';
import { FilterOptions } from '@src/store/feedSlice';
import { setFilter as updateFilter } from '@src/store/feedSlice';
import { fetchPosts as sliceFetchPosts } from '@src/store/feedSlice';
import { RootState, useAppDispatch, useAppSelector } from '@src/store/store';

import { Post } from 'types/prisma';
export const useFeed = () => {
  const dispatch = useAppDispatch();
  const { posts: allPosts, filter } = useAppSelector((state: RootState) => state.feed);
  const [posts, setPosts] = useState<Post[]>(allPosts[filter]);

  const setFilter = async (newFilter: FilterOptions) => {
    await dispatch(updateFilter(newFilter));
    fetchPosts(newFilter);
  };

  const fetchPosts = (newFilter? : FilterOptions) => dispatch(sliceFetchPosts(newFilter || filter));

  useEffect(() => {
    setPosts(allPosts[filter]);
  }, [filter, allPosts]);

  return {
    posts,
    filter,

    fetchPosts,
    setFilter,
  };
};