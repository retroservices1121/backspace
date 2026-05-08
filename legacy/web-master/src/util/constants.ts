// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

export const VERSION = 'BETA';
export const PRIVACY_URL = 'https://www.backspacethat.com/privacy';
export const TOS_URL = 'https://www.backspacethat.com/terms-conditions';
export const SUPPORT_EMAIL = 'support';
export const EMAIL_DOMAIN = 'backspacethat.com';
export const HOSTING_URL_BASE = 'backspace.to/';

export enum Modals {
  BanModal = 'BanModal',
}

export type BanModalProps = {
  username: string;
  id: string;
};
