// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TabList, TabPanel, Tabs } from 'react-tabs';

import Modal from 'components/ModalV2';
import { PermissionsType } from 'shared/types/documents';
import { toggleCommunitySettingsModal } from 'store/appSlice';
import { fetchMembers, fetchTiers, selectOwner } from 'store/communitySlice';
import { getCommunityNotificationSettings } from 'store/notificationsSlice';
import { selectRole } from 'store/selectors';
import { RootState } from 'store/store';
import { selectUid } from 'store/userSlice';
import { Space } from 'styles/layout';

import Channels from './Channels';
import CommunityInfo from './CommunityInfo';
import { CommunitySettingsTabs } from './components';
import Notifications from './Notifications';
import Permissions from './Permissions';
import PremiumTiers from './PremiumTiers';
import { Tab } from './styled';

// This function is only needed because each tab might be locked behind permissions
function createTabLists(userId: string, owner_id: string, permission: PermissionsType = PermissionsType.Anyone) {
  const tabTitles = [];
  const tabContent = [];

  // Its important that the order of the elements in the arrays is "the same"
  if (permission >= PermissionsType.Anyone) {
    tabTitles.push(CommunitySettingsTabs.Notifications);
    tabContent.push(<Notifications/>);
  }

  if (permission >= PermissionsType.Admin || userId === owner_id) {
    tabTitles.push(CommunitySettingsTabs.CommunityInfo);
    tabContent.push(<CommunityInfo/>);

    tabTitles.push(CommunitySettingsTabs.Channels);
    tabContent.push(<Channels/>);

    tabTitles.push(CommunitySettingsTabs.PremiumTier);
    tabContent.push(<PremiumTiers/>);

    tabTitles.push(CommunitySettingsTabs.RolesAndPermissions);
    tabContent.push(<Permissions/>);
  }

  return { tabTitles, tabContent };
}

const CommunitySettings: React.FC<any> = () => {
  const { communitySettingsModalOpen } = useSelector((state: RootState) => state.app);
  const uid = useSelector(selectUid);
  const owner = useSelector(selectOwner);
  const role = useSelector(selectRole);

  const { tabContent, tabTitles } = createTabLists(uid, owner.id, role);
  const [active, setActive] = useState(0);
  const dispatch = useDispatch();

  useEffect(() => {
    if (communitySettingsModalOpen) {
      // Lets pre-fetch the information for the other tabs to make the modal super smooth
      // Since community is already fetched, we'll always show that one first.
      dispatch(getCommunityNotificationSettings());
      dispatch(fetchTiers());
      dispatch(fetchMembers());
    } else {
      dispatch(fetchTiers());
      dispatch(fetchMembers());
      setActive(0);
    }
  }, [communitySettingsModalOpen]);

  return (
    //FIXME: This is going to require a fundemental rewrite to look right on mobile
    // it is functional on mobile but it requires scroll & stuff
    <Modal
      open={communitySettingsModalOpen}
      handleClose={() => dispatch(toggleCommunitySettingsModal())}
    >
      <div className={'p-8 h-screen w-screen sm:h-[800px] sm:w-[800px] w-max-screen h-max-screen overflow-auto '}>
        <h3>Settings</h3>
        <Space direction='column' />
        <Tabs className='sm:flex w-full' onSelect={index => setActive(index)}>
          <TabList className="mb-4 sm:flex flex-col sm:w-2/6">
            {tabTitles.map((title, idx) => (
              <Tab active={idx === active}>{title}</Tab>
            ))}
          </TabList>
          <main className="w-full sm:w-4/6 sm:ml-8">
            {tabContent.map(content => (
              <TabPanel>
                {content}
              </TabPanel>
            ))}
          </main>
        </Tabs>
      </div>
    </Modal>
  );
};
export default CommunitySettings;
