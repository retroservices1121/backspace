// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { useState } from 'react';
import { useRouter } from 'next/router';

import Drawer from 'components/Drawer';
import { Tabs } from 'components/Settings/common';
import SettingsList from 'components/Settings/SettingsList';
import { Card, Footer } from 'components/Settings/styledAgain';
import { logEventScreen, Screens } from 'lib/events';
import useQuery from 'lib/getQuery';
import { setPageTitle } from 'store/appSlice';
import { useAppDispatch } from 'store/store';
import { logout } from 'store/userSlice';
import { ClickableSpan, MediumTextButton } from 'styles/Buttons';
import { OldCol, OldRow } from 'styles/Flex';
import { Layout, Space } from 'styles/layout';
import { openInNewTab } from 'utils/common_utils';
import { PRIVACY_URL, TOS_URL } from 'utils/constants';

import Account from './account';
import Appearance from './appearance';
import Billing from './billing';
import Creator from './creator';
import Notifications from './notifications';
import Security from './security';


const Settings = () => {
  const dispatch = useAppDispatch();
  const query = useQuery();
  //TODO should probably normalize/centralize this
  const queryTab = query.get('tab');

  //@ts-ignore FIXME: BRENTON
  const router = useRouter<{ tab?: Tabs }>();
  //@ts-ignore FIXME: BRENTON
  let startTab : Tabs = router.state?.tab || Tabs.Account;
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
      <OldRow $full>
        <Drawer title="Settings">
          <Card>
            <SettingsList activeTab={tab} setActive={(value: Tabs) => setTab(value)}/>
            <OldCol $center>
              <Space direction="column" />
              <MediumTextButton color='none' onClick={handleLogout}>Logout</MediumTextButton>
              <Space direction="column" />
            </OldCol>
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
        <OldCol >
          {contentSwitch(tab)}
        </OldCol>
      </OldRow>
    </Layout>

  );
};

export default Settings;
