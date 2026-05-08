// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: List-like Representation of a Channel (icon and label)

import React, { useEffect } from 'react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getChannelReadCount, updateChannelReadCount } from 'api/communityAPI';
import { ReactComponent as ChatIcon } from 'graphics/channelicons/chat.svg';
import { ReactComponent as GridIcon } from 'graphics/channelicons/grid.svg';
import { ReactComponent as PostIcon } from 'graphics/channelicons/post.svg';
import { ReactComponent as LiveIcon } from 'graphics/commonicons/live.svg';
import { ReactComponent as LockIcon } from 'graphics/commonicons/lock.svg';
import { ReactComponent as TextIcon } from 'graphics/commonicons/message.svg';
import { ReactComponent as MoreIcon } from 'graphics/commonicons/more.svg';
import { ChannelDocument, ChannelType, PermissionsType } from 'shared/types/documents';
import { toggleEditChannelModal } from 'store/appSlice';
import { selectRole } from 'store/selectors';
import { RootState } from 'store/store';
import { Row } from 'styles/Flex';
import { Icon } from 'styles/Globals';

import { ListItem, Title, UnreadCount } from './styled';

type Props = {
  channel: ChannelDocument;
  active: boolean;
  handler: () => void;
  locked: boolean;
  roomId: string;
  disableEdit?: boolean;
};

//Trade channel type for an SVG icon
// TODO this should not be defined here
export const getChannelIcon = (type : ChannelType, active : boolean = false) => {
  switch (type) {
    case ChannelType.Chat:
      return <Icon $solid={false} $active={active} as={ChatIcon} />;
    case ChannelType.Post:
      return <Icon $solid={true} $active={active} as={PostIcon} />;
    case ChannelType.Discussion:
      return <Icon $solid={true} $active={active} as={TextIcon} />;
    case ChannelType.Library:
      return <Icon $solid={true} $active={active} as={GridIcon} />;
    case ChannelType.Livestream:
      return <Icon $solid={true} $active={active} as={LiveIcon} />;
    default:
      return <Icon $active={active} as={ChatIcon} />;
  }
};

// TODO change this name to Room
const ChannelList: React.FC<Props> = ({
  channel,
  active,
  locked,
  handler,
  roomId,
  disableEdit,
}) => {
  const dispatch = useDispatch();
  const uid = useSelector((state : RootState) => state.user.id);
  const communityId = useSelector((state : RootState) => state.community.id);
  const channels = useSelector((state : RootState) => state.community.channels);
  const [readCount, setReadCount] = useState<number>();
  const [totalCount, setTotalCount] = useState(0);
  const role = useSelector(selectRole);

  let title = channel.name || 'Room';
  if (title && title.length > 18) {
    title = `${title.slice(0, 18)}...`;
  }

  // Track and update read message count
  // TODO find a way to move this from here to somewhere more proper
  useEffect(() => {
    if (uid && channel.id) {
      getChannelReadCount(uid, channel.id).then((count : number) => setReadCount(count));
      let thisChan = channels.find((chan) => chan.id === channel.id);
      if (thisChan) setTotalCount(thisChan.message_count || 0);
    }
    if (active) {
      updateChannelReadCount(uid, communityId, channel.id );
    }

  }, [channels, active]);

  const calculateUnread = (total: number | undefined, read : number | undefined) => {
    if (!total || read === undefined) return 0;
    else {
      return total - read;
    }
  };

  const handleEditChanel = () => {
    // Just double checking, currently theres no firestore rule for this...
    if (role >= PermissionsType.Moderators) {
      dispatch(toggleEditChannelModal({ channelId: roomId }));
    }
  };

  return (
    <ListItem active={active} onClick={handler}>
      <Row>
        {locked ? <Icon $solid={true} $active={active} as={LockIcon} /> : getChannelIcon(channel.type, active)}
        <Title>
          {title}
          {/* {locked && <Hint>{PermissionsName[channel.permissions]} Only</Hint>} */}
        </Title>
      </Row>
      {active && role >= PermissionsType.Moderators && !disableEdit && (
        <Icon $clickable $solid $color="fontTertiary" as={MoreIcon} onClick={handleEditChanel}/>
      )}
      {(calculateUnread(totalCount, readCount) > 0) && !active && <UnreadCount>{calculateUnread(totalCount, readCount)}</UnreadCount>}
    </ListItem>
  );
};

export default ChannelList;
