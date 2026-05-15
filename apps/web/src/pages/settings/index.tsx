// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect } from 'react';
import { ChevronRightIcon } from '@heroicons/react/outline';
import { useRouter } from 'next/router';

import settingsLayout from 'layouts/settingsLayout';
import { Settings as SettingsCfg, Tabs } from 'components/Settings/common';
import { Icon } from 'styles/Globals';

import { APP } from '..';

// /settings used to redirect straight to /settings/account, which from
// the AccountDrawer's "Settings & privacy" felt like "Settings opened
// the profile-edit page." On mobile we now show an X-style settings
// list (Account / Notifications / Security / Wallet / Billing /
// Appearance / Creator) so users can pick a category. On desktop the
// settingsLayout sidebar already exposes the list, so we keep the
// auto-redirect there.

const TABS_ORDER: Tabs[] = [
  Tabs.Account,
  Tabs.Notifications,
  Tabs.Security,
  Tabs.Appearance,
  Tabs.Billing,
  Tabs.Creator,
  Tabs.Wallet,
];

type LayoutComponent<P = {}> = React.FC<P> & { Layout?: React.ComponentType };

const SettingsIndex: LayoutComponent = () => {
  const router = useRouter();

  // Desktop: redirect to Account so the layout's sidebar + content
  // pair stays meaningful. Mobile: render the inline list below.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 640) router.replace(APP.SETTINGS.ACCOUNT);
  }, []);

  return (
    <div className="sm:hidden">
      {TABS_ORDER.map((t) => {
        const cfg = SettingsCfg[t];
        return (
          <button
            type="button"
            key={t}
            onClick={() => router.push(`${APP.SETTINGS.INDEX}/${t.toLowerCase()}`)}
            className="flex w-full items-center gap-4 border-b border-dividerColor px-4 py-4 text-left hover:bg-backgroundLight transition-colors"
          >
            <Icon $solid={cfg.iconFill} as={cfg.icon} $color="primary" />
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold text-fontFocus">{cfg.title}</div>
              <div className="text-sm text-fontTertiary truncate">{cfg.description}</div>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-fontTertiary" />
          </button>
        );
      })}
    </div>
  );
};

SettingsIndex.Layout = settingsLayout;
export default SettingsIndex;
