/* eslint-disable @typescript-eslint/no-use-before-define */
// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { toast } from 'react-toastify';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { FireDB, paths } from 'api/firebase';
import { getMorePosts, getPosts, PostUnion } from 'api/PostAPI';
import { getAllFollowedUsers, getAllRecentUsers } from 'api/userAPI';
import { PostDocument } from 'shared/types/documents';
import { Sort } from 'types/feed';

import { RootState } from './store';
import { User } from './userSlice';

const NAMESPACE = 'feed';

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
  async (payload: FetchPostsPayload, thunkAPI) => {
    const { user, feed } = thunkAPI.getState() as RootState;
    if (user.isLoggedIn && feed.followedUsers) {
      let searchList : string[] = [];
      switch (payload.sorting){
        case Sort.Memberships:
          searchList = user.memberships?.map((membership) => membership.id) || [];
          break;
        default: 
          searchList = feed.followedUsers.map((value)=> value.id);
          break;
      }
      
      //TODO this if feels out of place. Might be able to do something better
      if (payload?.sorting === Sort.Memberships) {
        
      }
      thunkAPI.dispatch(clearPosts());
      const posts = await getPosts(
        searchList,
        payload?.sorting,
        user.memberships,
      );
      return posts;
    }
    return [];
  },
);

export const deletePost = createAsyncThunk(
  `${NAMESPACE}/deletePost`,
  async (post: PostDocument) => {
    const docPath = paths.posts(post.community, post.channel);
    const postTable = new FireDB<PostDocument>(docPath);
    await postTable.deleteDoc(post.id as string).catch(console.log);
    return post.id;
  },
);

export const fetchMorePosts = createAsyncThunk(
  `${NAMESPACE}/fetchMorePosts`,
  async (payload: FetchPostsPayload, thunkAPI) => {
    const { user, feed } = thunkAPI.getState() as RootState;
    if (user.isLoggedIn && feed.followedUsers) {
      const posts = await getMorePosts(
        feed.posts[feed.posts.length - 1].id || '',
        feed.followedUsers.map((value)=> value.id),
        payload?.sorting,
        user.memberships,
        payload?.count,
      );
      return posts;
    }
    return [];
  },
);

/** Users fetched this way are memoized */
export const fetchFollowedUsers = createAsyncThunk(
  `${NAMESPACE}/fetchFollowedUsers`,
  async (payload : string, thunkAPI) => {
    const {  } = thunkAPI.getState() as RootState;
    return getAllFollowedUsers(payload);
  },
);

/** Users fetched this way are memoized */
export const fetchRecentUsers = createAsyncThunk(
  `${NAMESPACE}/fetchRecetUsers`,
  async (payload : string, thunkAPI) => {
    const {  } = thunkAPI.getState() as RootState;
    return getAllRecentUsers(payload);
  },
);

type FeedState = {
  discoverModalOpen: boolean;
  posts: PostUnion[];
  followedUsers: User[];
  recentUsers: User[];
  userCache: Record<string, User>
  featuredPost?: string,
};

const initialState: FeedState = {
  discoverModalOpen: false,
  posts: [],
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
    clearPosts(state) {
      state.posts = [];
    },
  },
  extraReducers: builder => {
    builder.addCase(fetchPosts.fulfilled, (state, action) => {
      state.posts = action.payload || [];
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
    builder.addCase(deletePost.fulfilled, (state, action) => {
      state.posts = state.posts.filter(post => {
        return post.id !== action.payload;
      });
      toast.error('Post has been deleted');
    });
  },
});

export default feedSlice.reducer;
export const { toggleDiscoverModal, clearPosts } = feedSlice.actions;
