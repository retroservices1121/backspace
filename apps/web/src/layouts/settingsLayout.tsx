// Settings shell on the new design tokens. Desktop: 2-column split
// inside the desktop shell's center column — slim left sub-nav with
// the 7 settings tabs, content on the right. Mobile keeps the
// X-style sticky back-arrow header so the user always has a way
// out without the new shell rails to anchor them.
//
// All categories live behind /settings/<key>; this layout owns the
// nav highlight + the sticky title + the logout / legal footer.

import { useEffect, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/outline';
import useConstructor from '@src/hooks/useConstructor';
import useLogout from '@src/hooks/useLogout';
import { useRouter } from 'next/router';

import { Settings, Tabs } from 'components/Settings/common';
import { logEventScreen, Screens } from 'lib/events';
import { setPageTitle } from 'store/appSlice';
import { useAppDispatch } from 'store/store';
import { openInNewTab } from 'utils/common_utils';
import { PRIVACY_URL, TOS_URL } from 'utils/constants';

const TABS_ORDER: Tabs[] = [
  Tabs.Account,
  Tabs.Notifications,
  Tabs.Security,
  Tabs.Appearance,
  Tabs.Billing,
  Tabs.Creator,
  Tabs.Wallet,
];

export default function settingsLayout({ children }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pagePosition = 2; // /settings/<key>  →  index 2 after split('/')
  const routeTab = router.pathname.split('/')[pagePosition];
  let startTab: Tabs | null = null;
  Object.keys(Tabs).forEach((key) => {
    if (key.toLowerCase() === routeTab?.toLowerCase()) {
      startTab = Tabs[key as keyof typeof Tabs];
    }
  });

  useConstructor(() => {
    logEventScreen(Screens.Settings);
    dispatch(setPageTitle('Settings'));
  });

  const logout = useLogout();
  const handleLogout = () => { logout('user logout from settings'); };

  const [tab, setTab] = useState<Tabs>(startTab ?? Tabs.Account);
  useEffect(() => {
    const next = startTab ?? Tabs.Account;
    if (tab !== next) setTab(next);
  }, [startTab]);

  function changeTab(newTab: Tabs) {
    router.push(`${newTab.toLowerCase()}`);
    setTab(newTab);
  }

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/');
  };

  const currentTitle = startTab ?? 'Settings';

  return (
    <div className="font-display text-ink">
      {/* Mobile-only sticky back-arrow header — the new desktop
          shell already places this page in the center column with
          its own LeftNav, so on desktop we render the sub-nav inline
          rather than a second sticky bar. */}
      <div
        className="
          sm:hidden sticky top-0 z-10
          flex items-center gap-4
          border-b border-line bg-canvas/[0.78]
          backdrop-blur-[14px] backdrop-saturate-[160%]
          px-5 py-3
        "
      >
        <button
          type="button"
          onClick={goBack}
          className="
            w-9 h-9 rounded-full flex items-center justify-center
            text-ink-2 hover:bg-hover hover:text-ink transition-colors
          "
          aria-label="Back"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <span className="text-[18px] font-semibold text-ink">{currentTitle}</span>
      </div>

      {/* Desktop sticky title strip — matches the feed / profile
          TopTabs visually so settings doesn't feel orphaned. */}
      <div
        className="
          hidden sm:flex sticky top-0 z-10
          items-center justify-between
          px-6 py-3.5
          border-b border-line
          bg-canvas/[0.78]
          backdrop-blur-[14px] backdrop-saturate-[160%]
        "
      >
        <h1 className="m-0 text-[20px] font-bold tracking-[-0.02em] text-ink">
          {currentTitle}
        </h1>
      </div>

      <div className="sm:grid sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-6 sm:px-6 sm:py-5">
        {/* Desktop sub-nav. Hidden on mobile — the /settings index
            page renders the same list when there's no tab picked. */}
        <aside className="hidden sm:flex flex-col gap-1">
          {TABS_ORDER.map((value) => {
            const cfg = Settings[value];
            const isActive = tab === value;
            return (
              <button
                type="button"
                key={value}
                onClick={() => changeTab(value)}
                className={[
                  'group text-left px-3 py-2.5 rounded-[10px]',
                  'transition-colors duration-150',
                  isActive
                    ? 'bg-brand-soft text-ink'
                    : 'text-ink-2 hover:bg-hover hover:text-ink',
                ].join(' ')}
              >
                <div className={`text-[14px] font-semibold ${isActive ? 'text-ink' : ''}`}>
                  {cfg.title}
                </div>
                <div className="text-[11px] text-ink-3 mt-0.5 truncate">
                  {cfg.description}
                </div>
              </button>
            );
          })}

          <div className="mt-3 pt-3 border-t border-line">
            <button
              type="button"
              onClick={handleLogout}
              className="
                w-full text-left px-3 py-2.5 rounded-[10px]
                text-[14px] font-semibold text-pink-2
                hover:bg-pink-vivid/10 transition-colors
              "
            >
              Logout
            </button>
            <div className="mt-3 px-3 flex flex-col gap-1 text-[11px] font-mono text-ink-3">
              <button
                type="button"
                onClick={() => openInNewTab(TOS_URL)}
                className="text-left hover:text-ink-2 transition-colors"
              >
                Terms and Conditions
              </button>
              <button
                type="button"
                onClick={() => openInNewTab(PRIVACY_URL)}
                className="text-left hover:text-ink-2 transition-colors"
              >
                Privacy Policy
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
