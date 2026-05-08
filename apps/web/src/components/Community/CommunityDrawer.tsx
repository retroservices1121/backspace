// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import Drawer from 'components/Drawer';
import MobileDrawer from 'components/DrawerV2';
import { OldRow } from 'styles/Flex';

import ChannelBar from './ChannelBar';
import CommunityBar from './CommunityBar';

type Props = {};

const getDrawerContent: React.FC<Props> = () => {

  return (
    <>
      <MobileDrawer>
        <>
          <OldRow $full>
            {/* Vertical Community List */}
            <CommunityBar />

            {/* Community Banner & Channels */}
            <ChannelBar/>
          </OldRow>
        </>
      </MobileDrawer>

      <div className="hidden sm:flex">
        <Drawer title="Community" color='backgroundMedium'>
          <OldRow $full>
            {/* Vertical Community List */}
            <CommunityBar />

            {/* Community Banner & Channels */}
            <ChannelBar/>
          </OldRow>
        </Drawer>
      </div>
    </>
  );
};

export default getDrawerContent;
