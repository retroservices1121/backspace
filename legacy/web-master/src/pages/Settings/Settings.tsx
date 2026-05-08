// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';

import Drawer from 'components/Drawer';
import MobileDrawer from 'components/DrawerV2';
import { logEventScreen, Screens } from 'lib/events';
import useQuery from 'lib/getQuery';
import { openInNewTab } from 'shared/common_utils';
import { setPageTitle, toggleDrawer } from 'store/appSlice';
import { logout } from 'store/userSlice';
import { ClickableSpan, MediumTextButton } from 'styles/Buttons';
import { Col, Row } from 'styles/Flex';
import { HideOnMobile, Layout, Space } from 'styles/layout';
import { PRIVACY_URL, TOS_URL } from 'util/constants';

import Account from './Account';
import Appearance from './Appearance';
import Billing from './Billing';
import { Tabs } from './components/common';
import SettingsList from './components/SettingsList';
import Creator from './Creator';
import Notifications from './Notifications';
import Security from './Security';
import { Card, Footer } from './styled';


const Settings = () => {
  const dispatch = useDispatch();
  const query = useQuery();
  //TODO should probably normalize/centralize this
  const queryTab = query.get('tab');
  const location = useLocation<{ tab?: Tabs }>();
  let startTab : Tabs = location.state?.tab || Tabs.Account;
  //See if any match (case insensitive)
  Object.keys(Tabs).forEach((key) => {
    if (key.toLowerCase() === queryTab?.toLowerCase()) {
      startTab = Tabs[key as keyof typeof Tabs];
    }
  });
  logEventScreen(Screens.Settings);
  dispatch(setPageTitle('Settings'));

  const handleLogout = () => {
    dispatch(logout('user logout from settings'));
  };

  const [tab, setTab] = useState<Tabs>(startTab);

  const contentSwitch = (currentTab : Tabs) => {
    switch (currentTab) {
      case Tabs.Account:
        return (<Account />);
      case Tabs.Notifications:
        return (<Notifications />);
      case Tabs.Security:
        return (<Security />);
      case Tabs.Appearance:
        return (<Appearance />);
      case Tabs.Billing:
        return (<Billing />);
      case Tabs.Creator:
        return (<Creator />);
      default:
        return (<Account />);
    }
  };

  return (
    <Layout>
      <Row $full>
        <HideOnMobile>
          <Drawer title="Settings">
            <Card>
              <SettingsList activeTab={tab} setActive={(value: Tabs) => setTab(value)}/>
              <Col $center>
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
          </Drawer>
        </HideOnMobile>

        <MobileDrawer>
          <>
            <SettingsList activeTab={tab} setActive={(value: Tabs) => {
              setTab(value);
              dispatch(toggleDrawer());
            }} />
            <Col $center>
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
          </>
        </MobileDrawer>

        <Col >
          {contentSwitch(tab)}
        </Col>
      </Row>
    </Layout>

  );
};

export default Settings;
