// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Channel as ChannelType, Community as CommunityType, Permissions } from '@prisma/client';


export enum PostFormFields {
  Title = 'title',
  Caption = 'text',
  CommentsEnabled = 'commentsEnabled',
  PermissionsRequired = 'permissionsRequired',
  Tags = 'tags',
  Profile = 'profile',
  Community = 'community',
  Channel = 'channel',
}

export type PostFormState = {
  [PostFormFields.Title]: string;
  [PostFormFields.Caption]: string;
  [PostFormFields.CommentsEnabled]: boolean;
  [PostFormFields.PermissionsRequired]: Permissions;
  [PostFormFields.Tags]: string[];
  [PostFormFields.Profile]: boolean;
  //These are shown as Options for the sake of the selects
  [PostFormFields.Community]: { name: string, value:CommunityType };
  [PostFormFields.Channel]: { name: string, value:ChannelType };
};
