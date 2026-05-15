// Settings shell. Desktop keeps the side Drawer with the SettingsList
// (the user expects to bounce between tabs from there). Mobile drops
// the duplicate slide-in — the global AccountDrawer already exposes
// Wallet / Billing / Settings, and the page itself gets an X-style
// sticky header with a back arrow + tab title so the user always knows
// where they are and how to leave.

import { useEffect, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/outline';
import useConstructor from '@src/hooks/useConstructor';
import useLogout from '@src/hooks/useLogout';
import { useRouter } from 'next/router';

import Drawer from 'components/Drawer';
import { Tabs } from 'components/Settings/common';
import SettingsList from 'components/Settings/SettingsList';
import { Card, Footer } from 'components/Settings/styledAgain';
import { logEventScreen, Screens } from 'lib/events';
import { setPageTitle } from 'store/appSlice';
import { useAppDispatch } from 'store/store';
import { ClickableSpan, MediumTextButton } from 'styles/Buttons';
import { Col, Row } from 'styles/Flex';
import { Layout, Space } from 'styles/layout';
import { openInNewTab } from 'utils/common_utils';
import { PRIVACY_URL, TOS_URL } from 'utils/constants';

export default function settingsLayout({ children }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pagePosition = 2; // when you split path on /, settings page is 3rd
  const routeTab = router.pathname.split('/')[pagePosition];
  // `null` means "no specific tab" — i.e. /settings root. The mobile
  // header shows 'Settings' in that case, otherwise the tab name.
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
  const handleLogout = () => {
    logout('user logout from settings');
  };

  // Keep the local tab in sync with the URL — without this, deep-links
  // (Wallet/Billing/etc. from the AccountDrawer) leave the sidebar
  // highlighting the wrong row. Defaults to Account when the URL
  // doesn't pick one out (so the desktop sidebar still has something
  // highlighted on /settings root).
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

  return (
    <Layout>
      <Row $full>
        {/* Desktop: settings sidebar. Mobile: not rendered — the global
            AccountDrawer is the menu. */}
        <div className="hidden sm:flex">
          <Drawer title="Settings">
            <Card>
              <SettingsList activeTab={tab} setActive={(value: Tabs) => changeTab(value)} />
              <Col className="justify-center">
                <Space direction="column" />
                <MediumTextButton color="none" onClick={handleLogout}>Logout</MediumTextButton>
                <Space direction="column" />
              </Col>
              <Footer $center>
                <ClickableSpan onClick={() => openInNewTab(TOS_URL)}>
                  Terms and Conditions
                </ClickableSpan>
                <ClickableSpan onClick={() => openInNewTab(PRIVACY_URL)}>
                  Privacy Policy
                </ClickableSpan>
              </Footer>
            </Card>
          </Drawer>
        </div>

        <Col className="w-full">
          {/* Mobile-only: X-style sticky header with back arrow + tab
              name. Removed on desktop because the sidebar handles
              orientation. */}
          <div className="sm:hidden sticky top-0 z-10 flex items-center gap-6 border-b border-dividerColor bg-backgroundDark/80 px-4 py-3 backdrop-blur">
            <button
              type="button"
              onClick={goBack}
              className="p-1 rounded-full hover:bg-backgroundLight"
              aria-label="Back"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <span className="text-lg font-semibold">{startTab ?? 'Settings'}</span>
          </div>
          {children}
        </Col>
      </Row>
    </Layout>
  );
}
