// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ChannelDocument } from 'shared/types/documents';
import { toggleDrawer } from 'store/appSlice';
import { changeChannel } from 'store/communitySlice';
import { selectActiveChannel, selectRole } from 'store/selectors';
import { RootState } from 'store/store';

import ChannelItem from './ChannelItem';

type Props = {
  channels: ChannelDocument[];
};

const ChannelList: React.FC<Props> = ({
  channels,
}) => {
  const dispatch = useDispatch();
  const role = useSelector(selectRole);
  const channel = useSelector(selectActiveChannel);
  const community = useSelector((state: RootState) => state.community);
  const [channelList, setChannelList] = useState<ChannelDocument[]>();


  const handleChangeChannel = (id : string) => {
    if (community) {
      const matchIndex = channels?.findIndex((val) => val.id === id);
      dispatch(changeChannel(matchIndex || 0));
    }
  };

  //TODO could probably implement this in redux when channels are first pulled in
  useEffect(() => {
    let allChannels = [...channels];
    let orderedChannels : ChannelDocument[] = [];
    if (community.channel_order) {
      community.channel_order.forEach((chan) => {
        const match = allChannels.findIndex((val) => val.id === chan);
        if (match != -1) {
          orderedChannels.push(allChannels[match]); //add to ordered
          allChannels.splice(match, 1); //remove from array
        }
      });
      setChannelList([...orderedChannels, ...allChannels]);
    } else {
      setChannelList(allChannels);
    }
  }, [channels, community.channel_order]);

  return (
    <>
      {channelList?.map( (value) => (
        <ChannelItem
          key={value.id}
          roomId={value.id}
          channel={value}
          locked={value.access > role}
          active={value.id === channel?.id}
          handler={() => {
            if (window.innerWidth <= 760) {
              dispatch(toggleDrawer());
            }
            handleChangeChannel(value.id);
          }}
        />
      ))}
    </>
  );
};
export default ChannelList;
