// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Tab } from '@headlessui/react';
import { Permissions } from '@prisma/client';
import { HorizontalLine } from '@src/styles/Dividers';
import { Community } from '@src/types/prisma';

import useCommunity from 'hooks/entities/useCommunities';
import useUser from 'hooks/useUser';
import { FullScreen, useRegisterModal } from 'lib/Modal';
import { hasPermission } from 'lib/role';
import { Modals } from 'utils/constants';

import {
  CommunityInfo,
  CommunitySettingsTabs,
  Notifications,
  RolesAndPermissions,
} from './components';
import { TabButton } from './styled';


const CommunitySettings: React.FC<any> = () => {
  const { current: { role, community, members } } = useCommunity();
  const { user } = useUser();
  const Modal = useRegisterModal(Modals.CommunitySettings);

  const isAdmin = hasPermission(role, Permissions.ADMIN) || user.uuid === community.owner.uuid;
  
  return (
    <Modal>
      <FullScreen className='p-8'>
        <h3 className='mb-4'>Community Settings</h3>

        <Tab.Group as='div' vertical className="sm:flex">
          <Tab.List className="mb-4 sm:flex flex-col sm:w-2/6">
            {hasPermission(role, Permissions.EVERYONE) && (
              <TabButton>{CommunitySettingsTabs.Notifications}</TabButton>
            )}

            {isAdmin && (
              <>
                <h4 className='pt-4 text-primary border-t-2 border-backgroundLight'>
                  Admin Controls
                </h4>
                <TabButton>{CommunitySettingsTabs.CommunityInfo}</TabButton>
                {/* <TabButton>{CommunitySettingsTabs.Channels}</TabButton> */}
                {/* <TabButton>{CommunitySettingsTabs.PremiumTier}</TabButton> */}
                <TabButton>{CommunitySettingsTabs.RolesAndPermissions}</TabButton>
              </>
            )}
          </Tab.List>

          <Tab.Panels className="w-full sm:w-4/6 sm:ml-8">
            {hasPermission(role, Permissions.EVERYONE) && (
              <Tab.Panel><Notifications /></Tab.Panel>
            )}

            {isAdmin && (
              <>
                <Tab.Panel>
                  <CommunityInfo />
                </Tab.Panel>
                {/* <Tab.Panel>s
                  <Channels />
                </Tab.Panel> */}
                {/* <Tab.Panel>
                  <PremiumTiers />
                </Tab.Panel> */}
                <Tab.Panel>
                  <RolesAndPermissions members={members} />
                </Tab.Panel>
              </>
            )}
          </Tab.Panels>
        </Tab.Group>
      </FullScreen>
    </Modal>
  );
};
export default CommunitySettings;
