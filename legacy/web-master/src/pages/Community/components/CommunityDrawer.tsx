// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import Drawer from 'components/Drawer';
import MobileDrawer from 'components/DrawerV2';
import { HideOnMobile } from 'components/NavigationV2/styled';
import { Row } from 'styles/Flex';

import ChannelBar from './ChannelBar';
import CommunityBar from './CommunityBar';

type Props = {
  featuredCommunity?: string;
  followedCommunities: string[];
};

const CommunityDrawer: React.FC<Props> = ({
  featuredCommunity,
  followedCommunities,
}) => {

  return (
    <>
      <MobileDrawer>
        <>
          <Row $full>
            {/* Vertical Community List */}
            <CommunityBar
              featured={featuredCommunity}
              list={followedCommunities}
            />

            {/* Community Banner & Channels */}
            <ChannelBar/>
          </Row>
        </>
      </MobileDrawer>

      <HideOnMobile>
        <Drawer title="Community" color='backgroundMedium'>
          <Row $full>
            {/* Vertical Community List */}
            <CommunityBar
              featured={featuredCommunity}
              list={followedCommunities}
            />

            {/* Community Banner & Channels */}
            <ChannelBar/>
          </Row>
        </Drawer>
      </HideOnMobile>
    </>
  );
};

export default CommunityDrawer;
