// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: List-like Representation of a Channel (icon and label)

import React from 'react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { ChannelType, Permissions } from '@prisma/client';
import { useModal } from '@src/lib/Modal';
import { Modals } from '@src/utils/constants';
import { capitalize } from 'lodash';

import useChannel from 'hooks/entities/useChannel';
import Icons from 'icons';
import { getPower, hasPermission } from 'lib/role';
import { toggleEditChannelModal } from 'store/appSlice';
import { OldRow } from 'styles/Flex';
import { Icon } from 'styles/Globals';

import ChatIcon from 'public/graphics/channelicons/chat.svg';
import GridIcon from 'public/graphics/channelicons/grid.svg';
import PostIcon from 'public/graphics/channelicons/post.svg';
import LiveIcon from 'public/graphics/commonicons/live.svg';
import LockIcon from 'public/graphics/commonicons/lock.svg';
import TextIcon from 'public/graphics/commonicons/message.svg';
import MoreIcon from 'public/graphics/commonicons/more.svg';

import { Hint, ListItem, Title, UnreadCount } from './styled';

type Props = {
  active: boolean;
  handler: () => void;
  locked: boolean;
  disableEdit?: boolean;
  channelId: string;
  role: Permissions;
};

//Trade channel type for an SVG icon
// TODO this should not be defined here
export const getChannelIcon = (type : ChannelType, active : boolean = false) => {
  switch (type) {
    case ChannelType.CHAT:
      // return <Icons.Chat allowFill active={active} />
      return <Icon $solid={false} $active={active} as={ChatIcon} />;
    case ChannelType.POST:
      return <Icon $solid={true} $active={active} as={PostIcon} />;
    case ChannelType.DISCUSSION:
      return <Icon $solid={true} $active={active} as={TextIcon} />;
    case ChannelType.LIBRARY:
      return <Icon $solid={true} $active={active} as={GridIcon} />;
    case ChannelType.LIVESTREAM:
      return <Icon $solid={true} $active={active} as={LiveIcon} />;
    default:
      return <Icon $active={active} as={ChatIcon} />;
  }
};

// TODO change this name to Room
const ChannelItem: React.FC<Props> = ({
  active,
  locked,
  handler,
  channelId,
  role,
}) => {
  const { channel } = useChannel(channelId);
  const dispatch = useDispatch();
  const createChannelModal = useModal(Modals.EditChannel);
  const [readCount, setReadCount] = useState<number>();
  const [totalCount, setTotalCount] = useState(0);
  let title = channel.name || 'Room';
  if (title && title.length > 18) {
    title = `${title.slice(0, 18)}...`;
  }

  // // Track and update read message count
  // // TODO find a way to move this from here to somewhere more proper
  // useEffect(() => {
  //   if (uid && channel.id) {
  //     getChannelReadCount(uid, channel.id).then((count : number) => setReadCount(count));
  //     let thisChan = channels.find((chan) => chan.id === channel.id);
  //     if (thisChan) setTotalCount(thisChan.message_count || 0);
  //   }
  //   if (active) {
  //     updateChannelReadCount(uid, communityId, channel.id );
  //   }

  // }, [channels, active]);

  const calculateUnread = (total: number | undefined, read : number | undefined) => {
    if (!total || read === undefined) return 0;
    else {
      return total - read;
    }
  };

  const handleEditChannel = () => {
    // Just double checking, currently theres no firestore rule for this...
    if (hasPermission(role, Permissions.MODERATOR)) {
      createChannelModal.open();
    }
  };

  return (
    <ListItem active={active} onClick={handler}>
      <OldRow>
        {locked ? (
          <Icon $solid={true} $active={active} as={LockIcon} />
        ) : (
          getChannelIcon(channel.type, active)
        )}
        <Title>
          {title}
          {/* TODO write permission? */}
          {locked && <Hint>{capitalize(channel.readPermission)} Only</Hint>}
        </Title>
      </OldRow>
      {active && hasPermission(role, Permissions.MODERATOR) && (
        // <Icon $clickable $solid $color="fontTertiary" as={MoreIcon} onClick={handleEditChanel}/>
        <Icons.More onClick={handleEditChannel}/>
      )}
      {/* {(calculateUnread(totalCount, readCount) > 0) && !active && <UnreadCount>{calculateUnread(totalCount, readCount)}</UnreadCount>} */}
    </ListItem>
  );
};

export default ChannelItem;
