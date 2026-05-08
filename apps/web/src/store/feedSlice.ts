/* eslint-disable @typescript-eslint/no-use-before-define */
// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import axios from 'lib/axios';
import { PostDocument } from 'types/documents';
import { Sort } from 'types/feed';
import { Post } from 'types/prisma';

import { RootState } from './store';
import { OldUser } from './userSlice';

const NAMESPACE = 'feed';

export enum FilterOptions {
  DISCOVER = 'discover',
  RECENT = 'recent',
  FOLLOWING = 'following',
  COMMUNITY = 'community',
  // Web3 pivot: rank by author's prediction-market accuracy.
  // Until trades begin resolving, every user's rankingScore = 0 and
  // results are effectively chronological-by-tiebreak.
  ACCURACY = 'accuracy',
}

type FetchPostsPayload = {
  sorting?: Sort,
  count?: number,
  // TODO Pagination probably
};


export const setFeaturedPost = createAsyncThunk(
  `${NAMESPACE}/setFeaturedPost`,
  async (postId: string | undefined) => {
    return postId;
  },
);

export const fetchPosts = createAsyncThunk(
  `${NAMESPACE}/fetchPosts`,
  async (newFilter : FilterOptions, { getState }) => {
    const { feed } = getState() as RootState;
    const myFilter : string = newFilter || feed.filter;
    const { data } = await axios().get(`/posts/feed?filter=${myFilter}`);
    return { ...feed.posts, [myFilter]: data || [] };
  });

// export const setFilter = createAsyncThunk(
//   `${NAMESPACE}/setFilter`,
//   async (newFilter : FilterOptions, { }) => {
//     //Done in a thunk so we can run a promise train 
//     return newFilter;
//   });
// export const fetchPosts = createAsyncThunk(
//   `${NAMESPACE}/fetchPosts`,
//   async (payload: FetchPostsPayload, thunkAPI) => {
//     const { user, feed } = thunkAPI.getState() as RootState;
//     if (user.authId && feed.followedUsers) {
//       let searchList : string[] = [];
//       switch (payload.sorting) {
//         case Sort.Memberships:
//           searchList = user.memberships?.map((membership) => membership.id) || [];
//           break;
//         default: 
//           searchList = feed.followedUsers.map((value)=> value.id);
//           break;
//       }
      
//       //TODO this if feels out of place. Might be able to do something better
//       if (payload?.sorting === Sort.Memberships) {
        
//       }
//       thunkAPI.dispatch(clearPosts());
//       const posts = await getPosts(
//         searchList,
//         payload?.sorting,
//         user.memberships,
//       );
//       return posts;
//     }
//     return [];
//   },
// );

export const deletePost = createAsyncThunk(
  `${NAMESPACE}/deletePost`,
  async (post: PostDocument) => {
    // TODO: wire to DELETE /api/posts/{id} once the route exists.
    // The legacy Firestore deletion was removed in the Firebase cleanup
    // pass — until the Postgres-backed endpoint lands the thunk is a no-op.
    return post.id;
  },
);

export const fetchMorePosts = createAsyncThunk(
  `${NAMESPACE}/fetchMorePosts`,
  async (payload: FetchPostsPayload, thunkAPI) => {
    // const { user, feed } = thunkAPI.getState() as RootState;
    // if (user.isLoggedIn && feed.followedUsers) {
    //   const posts = await getMorePosts(
    //     feed.posts[feed.posts.length - 1].id || '',
    //     feed.followedUsers.map((value)=> value.id),
    //     payload?.sorting,
    //     user.memberships,
    //     payload?.count,
    //   );
    //   return posts;
    // }
    // return [];
  },
);


export const fetchFollowedUsers = createAsyncThunk<OldUser[], string>(
  `${NAMESPACE}/fetchFollowedUsers`,
  async () => {
    // Identity comes from the auth cookie server-side; we ignore the
    // payload (legacy callers pass the user's authId) and let the route
    // scope the response to the current user.
    const { data } = await axios().get('/follow');
    return data ?? [];
  },
);

// "Recent users" needs its own discovery endpoint (probably /api/users/recent
// with some lightweight ranking). Returns [] until that lands so the sidebar
// renders empty rather than crashing on a legacy Firestore document shape.
export const fetchRecentUsers = createAsyncThunk<OldUser[], string>(
  `${NAMESPACE}/fetchRecentUsers`,
  async () => [],
);

type FeedPosts = {
  [FilterOptions.DISCOVER]: Post[],
  [FilterOptions.RECENT]: Post[],
  [FilterOptions.FOLLOWING]: Post[],
  [FilterOptions.COMMUNITY]: Post[],
  [FilterOptions.ACCURACY]: Post[],
};

type FeedState = {
  filter: FilterOptions;
  posts: FeedPosts;

  discoverModalOpen: boolean;
  // posts: PostUnion[];
  followedUsers: OldUser[];
  recentUsers: OldUser[];
  userCache: Record<string, OldUser>
  featuredPost?: string,
};



const initialState: FeedState = {
  // Default to ACCURACY ranking — the core pivot premise is "the person who is
  // right 80% of the time gets seen, the person who is loud gets buried."
  // Until trades resolve, this falls back to recency-by-tiebreak server-side.
  filter: FilterOptions.ACCURACY,
  posts: <FeedPosts>{},

  discoverModalOpen: false,
  
  followedUsers: [],
  recentUsers: [],
  userCache: {},
  featuredPost: undefined,
};

const feedSlice = createSlice({
  name: NAMESPACE,
  initialState,
  reducers: {
    toggleDiscoverModal(state, action: PayloadAction<boolean>) {
      state.discoverModalOpen = action.payload || !state.discoverModalOpen;
    },
    setFilter(state, action: PayloadAction<FilterOptions>) {
      state.filter = action.payload || FilterOptions.ACCURACY;
    },
    clearPosts(state) {
      state.posts = initialState.posts;
    },
  },
  extraReducers: builder => {
    builder.addCase(fetchPosts.fulfilled, (state, action) => {
      state.posts = action.payload;
    });
    builder.addCase(fetchMorePosts.fulfilled, (state, action) => {
      //@ts-ignore https://redux-toolkit.js.org/usage/immer-reducers
      state.posts.push(...action.payload);
    });
    builder.addCase(fetchFollowedUsers.fulfilled, (state, action) => {
      state.followedUsers = action.payload;
    });
    builder.addCase(fetchRecentUsers.fulfilled, (state, action) => {
      state.recentUsers = action.payload;
    });
    builder.addCase(setFeaturedPost.fulfilled, (state, action) => {
      state.featuredPost = action.payload;
    });
    // builder.addCase(deletePost.fulfilled, (state, action) => {
    //   state.posts = state.posts.filter(post => {
    //     return post.id !== action.payload;
    //   });
    //   toast.error('Post has been deleted');
    // });
  },
});

export default feedSlice.reducer;
export const { setFilter, toggleDiscoverModal, clearPosts } = feedSlice.actions;
