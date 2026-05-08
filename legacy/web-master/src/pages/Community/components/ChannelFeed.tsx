// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useDispatch, useSelector } from 'react-redux';
import { Timestamp } from 'firebase/firestore';

import { sendChannelMessage } from 'api/communityAPI';
import FabPlus from 'components/FloatingActionButton/FabPlus';
import Header from 'components/Header';
import ChatInput from 'components/Rich/ChatInput';
import { ReactComponent as ChatIcon } from 'graphics/channelicons/chat.svg';
import { ReactComponent as PostIcon } from 'graphics/channelicons/post.svg';
import { ReactComponent as LiveIcon } from 'graphics/commonicons/live.svg';
import { ReactComponent as TextIcon } from 'graphics/commonicons/message.svg';
import { ChannelMessageDocument, ChannelType, MediaType, MessageType, PermissionsName, PermissionsType } from 'shared/types/documents';
import { togglePostModal, toggleSubscribeModal } from 'store/appSlice';
import { selectActiveChannel, selectRole } from 'store/selectors';
import { RootState } from 'store/store';
import { Button } from 'styles/Buttons';
import { Col, Row } from 'styles/Flex';
import { LargeIcon } from 'styles/Globals';
import { Space } from 'styles/layout';
import { ChannelTypeProperties } from 'types/channel';

import { TextHighlight } from '../styled';
import ChannelMessages from './ChannelMessages';

//Trade channel type for an SVG icon
const getLargeChannelIcon = (type : ChannelType, active : boolean = false) => {
  switch (type) {
    case ChannelType.Chat:
      return <LargeIcon $solid={false} $active={active} as={ChatIcon} />;
    case ChannelType.Post:
      return <LargeIcon $solid={true} $active={active} as={PostIcon} />;
    case ChannelType.Discussion:
      return <LargeIcon $solid={true} $active={active} as={TextIcon} />;
    case ChannelType.Livestream:
      return <LargeIcon $solid={true} $active={active} as={LiveIcon} />;
    default:
      return <LargeIcon $active={active} as={ChatIcon} />;
  }
};

type Props = {};

// if you come up with a better name, feel free. ChannelFeed is the "channel" where you see messages n shit.
// but I think, channel/room is now being used to refer to the bit of text that changes the ChannelFeed.
const ChannelFeed: React.FC<Props> = () => {
  const dispatch = useDispatch();
  const community = useSelector((state: RootState) => state.community);
  const channel = useSelector(selectActiveChannel);
  const user = useSelector((state: RootState) => state.user);
  const role = useSelector(selectRole);

  const sendMessage = async (text : string, media: File | undefined) => {
    if (community?.id && (community.activeChannelIndex < community.channels.length)) {
      const temp : ChannelMessageDocument = {
        type: MessageType.Channel,
        sender: user.id,
        community: community.id,
        channel: community.channels[community.activeChannelIndex].id,
        text: text,
        media: '',
        media_type: media ? MediaType.Image : MediaType.None,
        timestamp: Timestamp.now(),
      };
      sendChannelMessage(temp, media);
    }
  };

  if (!channel || !community) return (
    <Col $full>
      <Row $full $center>You have no channel selected.</Row>
    </Col>
  );

  return (
    <Col $full>
      <Header
        title={channel.name || community.name}
        postLevel={PermissionsName[channel.permissions]}
        viewLevel={PermissionsName[channel.access]}
        icon={channel.type && getLargeChannelIcon(channel.type, true)}
        description={channel.description}
      />

      {/* Chat Messages */}

      {role >= channel.access ? (
        <ChannelMessages/>
      ) : (
        <Col $full $center>
          <Row $center style={{ flexWrap: 'wrap' }}>
            You need to be a community rank
            {' '}
            <TextHighlight>"{PermissionsName[channel.access]}"</TextHighlight>
            {' '}
            or higher to view this room.
          </Row>
          <Space direction='column' size='sm' />
          {channel.access == PermissionsType.Subscribers &&
          <Button color='none' onClick={() => dispatch(toggleSubscribeModal())}>
            Subscribe to Community
          </Button>
          }
        </Col>
      )}

      {/* Chat input */}

      {
        ChannelTypeProperties[channel.type]?.allowMessages &&
          role >= channel.permissions &&
            <ChatInput
              allowMedia={ChannelTypeProperties[channel.type]?.allowMedia}
              onSubmit={(text, media) => sendMessage(text, media)}
            />
      }
      {
        ChannelTypeProperties[channel.type]?.allowPosts &&
          role >= channel.permissions &&
          <FabPlus text='Create Post' onClick={() => dispatch(togglePostModal(true))}/>
      }
    </Col>
  );
};
export default ChannelFeed;
