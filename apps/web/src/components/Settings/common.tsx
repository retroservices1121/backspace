// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { DefaultTheme } from 'styled-components';

import AppearanceIcon from '../../../public/graphics/commonicons/appearance.svg';
import BillingIcon from '../../../public/graphics/commonicons/billing.svg';
import CommunityIcon from '../../../public/graphics/commonicons/community.svg';
import NotificationIcon from '../../../public/graphics/commonicons/notification.svg';
import AccountIcon from '../../../public/graphics/commonicons/profile.svg';
import SettingsIcon from '../../../public/graphics/commonicons/settings.svg';

export enum Tabs {
  Account = 'Account',
  Notifications = 'Notifications',
  Security = 'Security',
  Appearance = 'Appearance',
  Billing = 'Billing',
  Creator = 'Creator',
}

export type SettingOption = {
  /** Title shown on setting */
  title: string;
  /** Description shown on setting */
  description: string;
  /** Icon shown. Should be SVG element */
  icon: typeof AccountIcon; //lazy but
  iconColor: keyof DefaultTheme;
};

export const Settings = {
  Account: {
    title: 'Account',
    description: 'Edit your account settings and profile.',
    icon: AccountIcon,
    iconFill: true,
  },
  Notifications: {
    title: 'Notifications',
    description: 'Set when you want to be notified.',
    icon: NotificationIcon,
    iconFill: false,
  },
  Security: {
    title: 'Security',
    description: 'Change your password and account security.',
    icon: SettingsIcon,
    iconFill: true,
  },
  Appearance: {
    title: 'Appearance',
    description: 'The look and feel of backspace.',
    icon: AppearanceIcon,
    iconFill: true,
  },
  Billing: {
    title: 'Billing',
    description: 'Add/Remove Payment Methods. View past transactions.',
    icon: BillingIcon,
    iconFill: true,
  },
  Creator: {
    title: 'Creator',
    description: 'Activate and edit your community.',
    icon: CommunityIcon,
    iconFill: true,
  },
};
