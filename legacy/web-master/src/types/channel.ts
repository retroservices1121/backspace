// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { ChannelType, PermissionsType } from 'shared/types/documents';

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
  [ChannelType.Chat]: <ChannelTypeAttributes>{
    name: 'Chat',
    description: 'Send Messages, pics, GIFs & more. All posting types are available.',
    allowMessages: true,
    allowPosts: true,
    allowMedia: true,
    active: true,
    view: Views.List,
  },
  [ChannelType.Post]: <ChannelTypeAttributes>{
    name: 'Post',
    description: 'Posts Only. Great for sending out updates or notices.',
    allowMessages: false,
    allowPosts: true,
    allowMedia: true,
    active: true,
    view: Views.List,
  },
  [ChannelType.Discussion]: <ChannelTypeAttributes>{
    name: 'Discussion',
    description: 'Send text messages only. Group Chat.',
    allowMessages: true,
    allowPosts: false,
    allowMedia: false,
    active: true,
    view: Views.List,
  },
  [ChannelType.Library]: <ChannelTypeAttributes>{
    name: 'Library',
    description: 'Posts Only, but in a Grid View.',
    allowMessages: false,
    allowPosts: true,
    allowMedia: false,
    active: true,
    view: Views.Grid,
  },
  [ChannelType.Livestream]: <ChannelTypeAttributes>{
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
  Type = 'channeltype',
  Name = 'name',
  Description = 'description',
  /** Permission Leve for viewing content */
  Access = 'access',
  /** Permissions Level for posting content */
  Post = 'permissions',
}

export type NewChannelState = {
  [NewChannelFields.Type] : ChannelType;
  [NewChannelFields.Name] : string;
  [NewChannelFields.Description] : string;
  [NewChannelFields.Access] : PermissionsType;
  [NewChannelFields.Post] : PermissionsType;
  /** Needed for editing the channel */
  id?: string;
};
