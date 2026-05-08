// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

export { default as Layout } from './Layout';
export { default as Tier } from './Tier';


export enum CommunitySettingsTabs {
  CommunityInfo = 'Community Info',
  Channels = 'Rooms',
  Notifications = 'Notifications',
  RolesAndPermissions = 'Roles and Permissions',
  PremiumTier = 'Premium Tiers',
}

// Tabs
export { default as Channels } from './Channels';
export { default as CommunityInfo } from './CommunityInfo';
export { default as Notifications } from './Notifications';
export { default as PremiumTiers } from './PremiumTiers';
export { default as RolesAndPermissions } from './Permissions';
