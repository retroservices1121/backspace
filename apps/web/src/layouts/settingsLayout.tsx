//import { useState, useEffect } from "react";
import { useState } from 'react';
import useConstructor from '@src/hooks/useConstructor';
import useLogout from '@src/hooks/useLogout';
import { useRouter } from 'next/router';

import Drawer from 'components/Drawer';
import MobileDrawer from 'components/DrawerV2';
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
  let startTab : Tabs = Tabs.Account;
  //See if any match (case insensitive)
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

  const [tab, setTab] = useState<Tabs>(startTab);

  function changeTab(newTab: Tabs) {
    router.push(`${newTab.toLowerCase()}`);
    setTab(newTab);
    return;
  }

  const drawerContent = () => {
    return (
      <Card>
        <SettingsList activeTab={tab} setActive={(value: Tabs) => changeTab(value)}/>
        <Col className='justify-center'>
          <Space direction="column" />
          <MediumTextButton color='none' onClick={handleLogout}>Logout</MediumTextButton>
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
    );
  };

  return (
    <Layout>
      <Row $full>
        <div className='hidden sm:flex'>
          <Drawer title="Settings">
            {drawerContent()}
          </Drawer>
        </div>
        <div className='flex sm:hidden'>
          <MobileDrawer>
            {drawerContent()}
          </MobileDrawer>
        </div>
        
        <Col>
          {children}
        </Col>
      </Row>
    </Layout>
  );
}

