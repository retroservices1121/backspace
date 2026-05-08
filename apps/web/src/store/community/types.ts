// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { Channel, Community, Member, Message } from 'types/prisma';
import { Override } from 'types/utilityTypes';



type MessagesV3 = Override<Message, {}>;

export type ChannelV3Partial = {
  messageMap: Record<string, MessagesV3>;
  messages: MessagesV3[];
  lastId?: bigint;
  canPaginate: boolean;
};

export type ChannelV3 = Override<Channel, ChannelV3Partial>;

export type CommunityV3 = Override<Community, {
  channels: Record<string, ChannelV3>;
  members: Record<string, Member>;
  memberOrder: string[];
  channelOrder: string[];
}>;

export type CommunitySlice = {
  /** True if the user has no communities */
  noFriends: boolean;
  communities: Record<string, CommunityV3>;
  communityOrder: string[];
  featured: string;
  selected: {
    community: string;
    channel: string;
  };
};
