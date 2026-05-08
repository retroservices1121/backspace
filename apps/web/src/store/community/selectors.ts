// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Permissions } from '@prisma/client';
import { createSelector } from '@reduxjs/toolkit';

import { hasPermission } from 'lib/role';
import { RootState } from 'store/store';
import { selectMemberships } from 'store/user/selectors';
import { Member } from 'types/prisma';

const selectSelectedCommunityId = (state: RootState) => state.community.selected.community;
const selectSelectedChannelId = (state: RootState) => state.community.selected.channel;
export const selectCommunityOrder = (state: RootState) => state.community.communityOrder;

export const selectCommunities = (state: RootState) => state.community.communities;

export const selectCurrentCommunity = createSelector(
  selectSelectedCommunityId,
  selectCommunities,
  (uuid, communities) => communities[uuid],
);

const selectChannelOrder = createSelector(
  selectCurrentCommunity,
  community => community?.channelOrder || [],
);

/** Gets channels for current communtiy */
export const selectChannels = createSelector(
  selectCurrentCommunity,
  community => community?.channels || {},
);

/** Array of channels sorted by community channel order */
export const selectSortedChannels = createSelector(
  selectCurrentCommunity,
  selectChannelOrder,
  (community, order) => order.map(id => community.channels[id]),
);

export const selectCurrentChannel = createSelector(
  selectSelectedChannelId,
  selectChannels,
  (id, channels) => channels[id],
);

/** Gets user role for current community */
export const selectRole = createSelector(
  selectCurrentCommunity,
  selectMemberships,
  (community, memberships) =>
    memberships.find(m => m.communityId === community?.id)?.role || Permissions.EVERYONE,
);

export const selectOwner = createSelector(
  selectCurrentCommunity,
  (community) => community?.ownerId,
);


/** Gets user's featured community */
export const selectFeatured = createSelector(
  (state: RootState) => state.community.featured,
  selectCommunities,
  (uuid, communities) => communities[uuid],
);

/** All community users */
export const selectCommunityMembers = createSelector(
  selectCurrentCommunity,
  (community) => {
    const order = community?.memberOrder || [];
    return order.map(id => community.members[id]);
  },
);

/** Only users with permission to read the current channel */
export const selectChannelMembers = createSelector(
  selectCurrentCommunity,
  selectCurrentChannel,
  (community, channel) => {
    if (!channel || !community) {
      if (community) {
        return community.memberOrder.map((id) => community.members[id]);
      } else {
        return [];
      }
    }
    const members: Member[] = [];
    community.memberOrder.forEach(id => {
      const member = community.members[id];
      if (hasPermission(member.role, channel.readPermission)) {
        members.push(member);
      }
    });
    return members;
  },
);

/** Channels current user can post to */
export const selectPostableCommunities = createSelector(
  selectMemberships,
  (memberships) => { 
    const allowedChannels = memberships.map(membership => {
      const channels = membership.community?.channels;
      const filteredChannels = channels?.filter((chan) => chan.writePermission <= membership.role);
      return {
        community: membership.community,
        channels: filteredChannels || [],
      };
    });
    return allowedChannels.filter((each) => each.channels.length > 0); 
  });
