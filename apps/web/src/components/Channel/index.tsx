// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import MessageList from '@src/components/Channel/MessageList';

import Header from 'components/Channel/Header';
import FabPlus from 'components/FloatingActionButton/FabPlus';
import ChatInput from 'components/Rich/ChatInput';
import useChannel from 'hooks/entities/useChannel';
import useModals from 'hooks/useModals';
import { hasPermission } from 'lib/role';
import { OldCol } from 'styles/Flex';
import { ChannelTypeProperties } from 'types/channel';

import NoChannelAccess from './NoChannelAccess';

type Props = { id: string };

// if you come up with a better name, feel free. ChannelFeed is the "channel" where you see messages n shit.
// but I think, channel/room is now being used to refer to the bit of text that changes the ChannelFeed.
const ChannelFeed: React.FC<Props> = ({ id }) => {
  const { channel, role, run: { sendMessage } } = useChannel(id);
  const { toggleSubscribe, togglePost } = useModals();

  if (!hasPermission(role, channel.readPermission))
    return (
      <OldCol $full>
        <Header channel={channel} />
        <NoChannelAccess channel={channel} onSubscribe={toggleSubscribe} />
      </OldCol>
    );

  const showChatInput = ChannelTypeProperties[channel.type]?.allowMessages &&
    hasPermission(role, channel.writePermission);
  const showPostBtn = ChannelTypeProperties[channel.type]?.allowPosts &&
    hasPermission(role, channel.writePermission);

  return (
    <OldCol $full>
      <Header channel={channel} />
      <MessageList channelId={channel.uuid} />

      {showChatInput && (
        <ChatInput
          allowMedia={ChannelTypeProperties[channel.type]?.allowMedia}
          onSubmit={(text, media) => sendMessage({ text, media })}
        />
      )}
      {/* TODO incorporate this into the chatInput because mobile sucks otherwise */}
      {showPostBtn && (
        <div className='hidden md:block'>
          <FabPlus text='Create Post' onClick={togglePost} />
        </div>
      )}
    </OldCol>
  );
};
export default ChannelFeed;
