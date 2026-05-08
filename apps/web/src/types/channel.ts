// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { ChannelType, Permissions } from '@prisma/client';

export type ChannelTypeAttributes = {
  name: string;
  description: string;
  /** Allow Channel DM style messages */
  allowMessages: boolean;
  /** Allow Multi-Media Posts */
  allowPosts: boolean;
  /** Allow Media in messages */
  allowMedia: boolean;
  /** Can I create new channels with this type? */
  active: boolean;
  /** View */
  view: Views;
};


export enum Views {
  List = 'List',
  Grid = 'Grid',
}

// What factors change based on Channel Type?
export const ChannelTypeProperties = {
  [ChannelType.CHAT]: <ChannelTypeAttributes>{
    name: 'Chat',
    description: 'Send Messages, pics, GIFs & more. All posting types are available.',
    allowMessages: true,
    allowPosts: true,
    allowMedia: true,
    active: true,
    view: Views.List,
  },
  [ChannelType.POST]: <ChannelTypeAttributes>{
    name: 'Post',
    description: 'Posts Only. Great for sending out updates or notices.',
    allowMessages: false,
    allowPosts: true,
    allowMedia: true,
    active: true,
    view: Views.List,
  },
  [ChannelType.DISCUSSION]: <ChannelTypeAttributes>{
    name: 'Discussion',
    description: 'Send text messages only. Group Chat.',
    allowMessages: true,
    allowPosts: false,
    allowMedia: false,
    active: true,
    view: Views.List,
  },
  [ChannelType.LIBRARY]: <ChannelTypeAttributes>{
    name: 'Library',
    description: 'Posts Only, but in a Grid View.',
    allowMessages: false,
    allowPosts: true,
    allowMedia: false,
    active: true,
    view: Views.Grid,
  },
  [ChannelType.LIVESTREAM]: <ChannelTypeAttributes>{
    name: 'Livestream',
    description: 'Coming Soon!',
    allowMessages: true,
    allowPosts: false,
    allowMedia: false,
    active: false,
    view: Views.List,
  },
};


export enum NewChannelFields {
  Type = 'type',
  Name = 'name',
  Description = 'description',
  /** Permission Leve for viewing content */
  Read = 'readPermission',
  /** Permissions Level for posting content */
  Write = 'writePermission',
}

export type NewChannelState = {
  [NewChannelFields.Type] : ChannelType;
  [NewChannelFields.Name] : string;
  [NewChannelFields.Description] : string;
  [NewChannelFields.Read]: Permissions;
  [NewChannelFields.Write]: Permissions;
  /** Needed for editing the channel */
  id?: bigint;
};
