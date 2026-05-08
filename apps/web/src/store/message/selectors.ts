// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { createSelector } from '@reduxjs/toolkit';

import { RootState } from 'store/store';

export const selectConversations = (state: RootState) => state.message.conversations;
export const selectActiveId = (state: RootState) => state.message.activeConversation;

export const selectActive = createSelector(
  selectConversations,
  selectActiveId,
  (conversations, id) => id && conversations[id.toString()],
);
