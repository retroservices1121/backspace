// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import copy from 'copy-to-clipboard';
import Icons from 'icons';
import { useTheme } from 'styled-components';

import { ReactComponent as SettingsIcon } from 'graphics/commonicons/settings.svg';
import { ReactComponent as ShareIcon } from 'graphics/commonicons/share.svg';
//Placeholder Banner Img
import placeholderBanner from 'graphics/placeholders/banner.png';
import { useCommunityMedia } from 'hooks/getCommunityMedia';
import { APP } from 'pages';
import { Title } from 'pages/Community/components/ChannelItem/styled';
import { isDevelopment } from 'shared/common_utils';
import { PermissionsType } from 'shared/types/documents';
import { toggleCommunitySettingsModal, toggleCreateChannelModal, toggleSubscribeModal } from 'store/appSlice';
import { selectRole } from 'store/selectors';
import { RootState } from 'store/store';
import { Button } from 'styles/Buttons';
import { Row } from 'styles/Flex';
import { Footer, Space } from 'styles/layout';

import ChannelList from './ChannelList';
import { AddChannel, BannerImage, BannerImageContainer, ChannelBarContainer, ChannelListLabel, ColumnBreak, 
  CommunityActionIcon, CommunityActions, CommunityTitle, Overlay } from './styled';

type Props = {};

const ChannelBar: React.FC<Props> = ({
}) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const uid = useSelector((state : RootState) => state.user.id);
  const community = useSelector((state: RootState) => state.community);
  const role = useSelector(selectRole);

  // TODO Remove in https://linear.app/newsocial/issue/BC-203
  const { banner } = useCommunityMedia(community.id);

  const handleAddChannel = () => dispatch(toggleCreateChannelModal(true));

  const handleEditCommunity = () => dispatch(toggleCommunitySettingsModal(true));
  const handleShareCommunity = () => {
    if (community.owner_name) {
      copy(`${window.location.origin}${APP.PROFILE.USERNAME(community.owner_name)}`);
      toast.success('Copied to clipboard.', {
        // This way its closer to the button, which might be more noticeable
        position: 'top-left',
        toastId: 'copy-community-link',
      });
    } else {
      // Unlikely/improbable but ehh, just in case.
      toast.error('Could not copy share link at this time.', {
        position: 'top-left',
      });
    }
  };

  if (!community.id) {
    return (
      <h4 style={{ margin: '30px auto' }}>
        Select a community <br/> from the left.
      </h4>
    );
  }

  return (
    <ChannelBarContainer>
      <BannerImageContainer>
        <Overlay />
        <BannerImage src={banner || placeholderBanner} alt="banner"/>
        <CommunityTitle>{community.name}</CommunityTitle>
        <CommunityActions>
        <CommunityActionIcon
          color='fontFocus'
          $clickable
          $solid
          onClick={handleEditCommunity}
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

      <ChannelList
        channels={community.channels}
      />

      <Space size='sm' direction='column' />

      {community.owner_id === uid && (
        <AddChannel onClick={handleAddChannel}>
          <Row $center>
            <Icons.Plus color='primary' />
            <Title style={{ color: theme.primary }}>Add Room</Title>
          </Row>
        </AddChannel>
      )}

      <Footer $center>
        {isDevelopment() && role >= PermissionsType.Subscribers && (
          <Button color='none' onClick={() => dispatch(toggleSubscribeModal())}>
            Test Subscribe as User
          </Button>
        )}
        {role < PermissionsType.Subscribers && (
          <Button color='none' onClick={() => dispatch(toggleSubscribeModal())}>
            Subscribe to Community
          </Button>
        )}
      </Footer>
    </ChannelBarContainer>
  );
};


export default ChannelBar;
