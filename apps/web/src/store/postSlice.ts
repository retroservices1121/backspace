// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { toast } from 'react-toastify';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Modals } from '@src/utils/constants';

import axios from 'lib/axios';
import { Comment, Post } from 'types/prisma';

import { toggleModal } from './modalSlice';

const NAMESPACE = 'post';

function populateStateFromObject(object: any, state: PostState) {
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      state[key] = object[key];
    }
  }
  return state;
  
}

export const viewPost = createAsyncThunk(
  `${NAMESPACE}/viewPost`,
  async (postId : bigint, { dispatch }) => {
    const { data } = await axios().get(`/post?id=${postId}`);
    dispatch(setPost(data));
    dispatch(toggleModal(Modals.PostViewer, true));
  });

export const viewPostByUUID = createAsyncThunk(
  `${NAMESPACE}/viewPostByUUID`,
  async (postUUID : string, { dispatch }) => {
    const { data } = await axios().get(`/post?uuid=${postUUID}`);
    dispatch(setPost(data));
    dispatch(toggleModal(Modals.PostViewer, true));
  });

export const fetchComments = createAsyncThunk(
  `${NAMESPACE}/fetchComments`,
  async (postId : bigint) => {
    const { data } = await axios().get(`/comments?postId=${postId}`);
    return data;
  });

type PostState = Post & {
  comments: Comment[]
};

const initialState: PostState = <PostState>{};

/** Post Viewer Control Slice */
const postSlice = createSlice({
  name: NAMESPACE,
  initialState,
  reducers: {
    setPost: (_, { payload }) => payload as PostState,
    updatePost: (state, { payload }) => state = populateStateFromObject(payload, state),
    pushComment: (state, { payload }) => { state.comments = [...(state.comments ?? []), payload]; },
    updateComment: (state, { payload }) => {
      const idx = state.comments?.findIndex(c => c.id === payload.id) ?? -1;
      if (idx >= 0) state.comments[idx] = { ...state.comments[idx], ...payload };
    },
    removeComment: (state, { payload: id }) => {
      state.comments = (state.comments ?? []).filter(c => c.id !== id);
    },
    clearPost: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchComments.fulfilled, (state, { payload }) => {
      //This keeps us from needing an entity map, but catches quick switching
      if (payload && payload.length > 0 && payload[0].postId === state.id) {
        state.comments = payload as Comment[];  
      } else {
        state.comments = [];
      }
      
    });
  },
});

export default postSlice.reducer;
export const {
  setPost, updatePost, pushComment, updateComment, removeComment, clearPost,
} = postSlice.actions;