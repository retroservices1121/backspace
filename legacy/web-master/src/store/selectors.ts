// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

/**
 * This file is for reusable selectors.
 *
 * Only put selectors that are doing more than just grabbing a key on a slice or a slice itself.
 *
 * Don't put too complicated logic in selectors.
 */

//For selector composition, see https://github.com/reduxjs/reselect
import { createSelector } from 'reselect';

import { ChannelDocument, PermissionsType } from 'shared/types/documents';
import { themes } from 'styles/theme';

import { RootState } from './store';

export const appTheme = (state: RootState) => state.app.theme;
const communityNotifications = (state: RootState) => state.notifications.communities;
const currentCommunity = (state: RootState) => state.community.id;
const userId = (state: RootState) => state.user.id;
const communityMembers = (state: RootState) => state.community.members || [];


export const getTheme = createSelector(appTheme, theme => themes[theme]);

export const selectCommunityNotifications = createSelector(
  communityNotifications,
  currentCommunity,
  (communities, id) => communities[id],
);

const selectChannels = (state: RootState) => state.community.channels;

export const selectEditChannelState = createSelector(
  (state: RootState) => state.app.editChannelModal?.id || null,
  selectChannels,
  (channelId, channels) => channels.find(c => c.id === channelId) || null,
);

export const selectActiveChannel = createSelector(
  (state: RootState) => state.community.activeChannelIndex,
  selectChannels,
  (index, channels) => channels[index] as ChannelDocument | undefined,
);

export const selectRole = createSelector(
  communityMembers,
  userId,
  (members, uid) => members.find((member) => member.uid === uid)?.role || PermissionsType.Anyone,
);
