// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { randomIntFromInterval } from './common_utils';

export const VERSION = 'BETA';
export const PRIVACY_URL = 'https://www.backspacethat.com/privacy';
export const TOS_URL = 'https://www.backspacethat.com/terms-conditions';
export const SUPPORT_EMAIL = 'support';
export const EMAIL_DOMAIN = 'backspacethat.com';
export const HOSTING_URL_BASE = 'backspace.to/';

//TODO find a better place for this
export const defaultAvatar = () => {
  const num = randomIntFromInterval(1, 16);
  return `default/user/${num}.png`;
};

export const MEDIA_DISPLAY_PX = '550px';

export const MAX_BYTES = 10_000_000;
export const MAX_POST_BYTES = 1_000_000_000;

export const STRIPE_PERCENT_FEE = 15; //in percent (i.e. 10 = 10%)
export enum Modals {
  AppWelcome = 'AppWelcome',
  CommunitySettings = 'CommunitySettings',
  CreateChannel = 'CreateChannel',
  EditChannel = 'EditChannel',
  CreatePost = 'CreatePost',
  DeleteMessage = 'DeleteMessage',
  PostViewer = 'PostViewer',
  PostViewerDelete = 'PostViewerDelete',
}
