// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useSelector } from 'react-redux';
import { Permissions } from '@prisma/client';
import { useTheme } from 'styled-components';

import { Title } from 'components/MediaPost/styled';
import useCommunity, { shareCommunity } from 'hooks/entities/useCommunities';
import useBilling from 'hooks/useBilling';
import useMedia from 'hooks/useMedia';
import Icons from 'icons';
import { hasPermission } from 'lib/role';
import { RootState } from 'store/store';
import { Button } from 'styles/Buttons';
import { OldRow } from 'styles/Flex';
import { Footer, Space } from 'styles/layout';
import { isDevelopment } from 'utils/common_utils';

import SettingsIcon from 'public/graphics/commonicons/settings.svg';
import ShareIcon from 'public/graphics/commonicons/share.svg';
import placeholderBanner from 'public/graphics/placeholders/banner.png';

import ChannelList from './ChannelList';
import {
  AddChannel,
  BannerImage,
  BannerImageContainer,
  ChannelBarContainer,
  ChannelListLabel,
  ColumnBreak, 
  CommunityActionIcon,
  CommunityActions,
  CommunityTitle,
  Overlay,
} from './styled';

type Props = {};

const ChannelBar: React.FC<Props> = ({
}) => {
  const { current: { community, role }, run } = useCommunity();
  const { toggleSubscribeModal } = useBilling();
  const theme = useTheme();
  const uid = useSelector((state : RootState) => state.user.id);
  // const role = useSelector(selectRole);

  // TODO Remove in https://linear.app/newsocial/issue/BC-203
  // const { banner } = useCommunityMedia(community.fbid);

  const handleShareCommunity = () => shareCommunity(community.owner.username);

  if (!community) return null; 

  const banner = useMedia(community.banner);

  return (
    <ChannelBarContainer>
      <BannerImageContainer>
        <Overlay />
        <BannerImage src={banner || placeholderBanner as unknown as string} alt="banner"/>
        <CommunityTitle>{community.name}</CommunityTitle>
        <CommunityActions>
        <CommunityActionIcon
          color='fontFocus'
          $clickable
          $solid
          onClick={run.openSettings}
          as={SettingsIcon}
        />
        <CommunityActionIcon
          color='fontFocus'
          $clickable
          $solid
          onClick={handleShareCommunity}
          as={ShareIcon}
        />
        </CommunityActions>
        
      </BannerImageContainer>



      <ColumnBreak />

      <ChannelListLabel>
        <h4>Rooms</h4>
      </ChannelListLabel>

      <ChannelList />

      <Space size='sm' direction='column' />

      {community.owner.id === uid && (
        <AddChannel onClick={run.openCreateChannel}>
          <OldRow $center>
            <Icons.Plus color='primary' />
            <Title style={{ color: theme.primary }}>Add Room</Title>
          </OldRow>
        </AddChannel>
      )}

      <Footer $center>
        {isDevelopment() && hasPermission(role, Permissions.SUBSCRIBER) && (
          <Button color='none' onClick={toggleSubscribeModal}>
            Test Subscribe as User
          </Button>
        )}
        {!hasPermission(role, Permissions.SUBSCRIBER) && (
          <Button color='none' onClick={toggleSubscribeModal}>
            Subscribe to Community
          </Button>
        )}
      </Footer>
    </ChannelBarContainer>
  );
};


export default ChannelBar;
