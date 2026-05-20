/* eslint-disable @typescript-eslint/no-use-before-define */
// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { MarketCardData } from '@src/components/Market/MarketCard';
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
  // Catalog browse — bypasses Posts entirely. The feed renders Market
  // rows directly so users can see what's tradeable without anyone
  // having to author a post around them.
  MARKETS = 'markets',
  // Same idea for the Dflow spot token catalog. Renders Token rows
  // instead of Posts; eventually backed by trending/volume sort once
  // those columns + import job ship.
  TOKENS = 'tokens',
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

// Standalone catalog fetch for the MARKETS filter — the active-market
// snapshot from /api/markets. The API serializes dates as ISO strings;
// MarketCard expects real Date objects (timeUntil() calls .getTime()),
// so convert closesAt + outcome timestamps at the boundary — same shape
// the single-market useMarket() hook produces.
export const fetchMarkets = createAsyncThunk<MarketCardData[]>(
  `${NAMESPACE}/fetchMarkets`,
  async () => {
    const { data } = await axios().get('/markets');
    const raw = Array.isArray(data) ? data : [];
    return raw.map((m) => ({
      ...m,
      closesAt: new Date(m.closesAt),
      outcomes: (m.outcomes ?? []).map(
        (o: MarketCardData['outcomes'][number] & { lastPriceAt: string | null }) => ({
          ...o,
          lastPriceAt: o.lastPriceAt ? new Date(o.lastPriceAt) : null,
        }),
      ),
    })) as MarketCardData[];
  },
);

// Shape returned by /api/tokens — kept small (no price/volume fields
// yet, those land with the trending-data migration). Once volume
// columns ship, extend this in lockstep with the API serializer.
export type TokenLite = {
  id: string;
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string | null;
};

export const fetchTokens = createAsyncThunk<TokenLite[]>(
  `${NAMESPACE}/fetchTokens`,
  async () => {
    const { data } = await axios().get('/tokens?limit=100');
    return (Array.isArray(data) ? data : []) as TokenLite[];
  },
);

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

// Recently-onboarded users for the Discover sidebar. The legacy thunk
// took an authId arg; we ignore it (server scopes to req.authId).
export const fetchRecentUsers = createAsyncThunk<OldUser[], string>(
  `${NAMESPACE}/fetchRecentUsers`,
  async () => {
    const { data } = await axios().get('/users/recent');
    return (data ?? []) as OldUser[];
  },
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
  // Separate from `posts` because Market rows aren't Posts. The
  // MARKETS filter renders straight from this array; all the other
  // filters render from posts[filter].
  markets: MarketCardData[];
  // Same pattern for the Token catalog under the TOKENS filter.
  tokens: TokenLite[];

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
  markets: [],
  tokens: [],

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
    // Live-update reducers for the feed. usePost dispatches these on
    // create/update/delete so the user doesn't have to refresh to see
    // their own action take effect. Each iterates every loaded filter
    // bucket because the same post can sit in multiple feeds at once.
    prependPost(state, { payload }: PayloadAction<Post>) {
      for (const key of Object.keys(state.posts) as (keyof FeedPosts)[]) {
        const list = state.posts[key];
        if (!Array.isArray(list)) continue;
        if (list.some(p => p.id === payload.id)) continue;
        state.posts[key] = [payload, ...list];
      }
    },
    updatePostInFeed(state, { payload }: PayloadAction<Post>) {
      for (const key of Object.keys(state.posts) as (keyof FeedPosts)[]) {
        const list = state.posts[key];
        if (!Array.isArray(list)) continue;
        const idx = list.findIndex(p => p.id === payload.id);
        if (idx >= 0) list[idx] = { ...list[idx], ...payload };
      }
    },
    removePostFromFeed(state, { payload: id }: PayloadAction<bigint>) {
      for (const key of Object.keys(state.posts) as (keyof FeedPosts)[]) {
        const list = state.posts[key];
        if (!Array.isArray(list)) continue;
        state.posts[key] = list.filter(p => p.id !== id);
      }
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
    builder.addCase(fetchMarkets.fulfilled, (state, action) => {
      state.markets = action.payload;
    });
    builder.addCase(fetchTokens.fulfilled, (state, action) => {
      state.tokens = action.payload;
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
export const {
  setFilter,
  toggleDiscoverModal,
  clearPosts,
  prependPost,
  updatePostInFeed,
  removePostFromFeed,
} = feedSlice.actions;
