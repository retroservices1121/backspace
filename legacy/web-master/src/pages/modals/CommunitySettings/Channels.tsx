// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { ReactComponent as UpArrow } from 'graphics/arrows/collapse.svg';
import { ReactComponent as DownArrow } from 'graphics/arrows/expand.svg';
import ChannelItem from 'pages/Community/components/ChannelItem';
import { arrayMove } from 'shared/common_utils';
import { ChannelDocument, CommunityDocument } from 'shared/types/documents';
import { updateCommunity } from 'store/communitySlice';
import { RootState } from 'store/store';
import { ButtonLarge } from 'styles/Buttons';
import { Row } from 'styles/Flex';
import { Icon } from 'styles/Globals';
import { Space } from 'styles/layout';

import { CommunitySettingsTabs } from './components';
import Layout from './components/Layout';
import { ChannelOrderButton, ChannelOrderItem } from './styled';


const Channels: React.FC = () => {
  const community = useSelector((state: RootState) => state.community);
  const channels = useSelector((state: RootState) => state.community.channels || []);
  const [channelList, setChannelList] = useState<Array<ChannelDocument>>([]);
  const dispatch = useDispatch();

  const moveUp = (channel: ChannelDocument, currentIndex: number) => {
    let temp = [...channelList];
    if (currentIndex - 1 >= 0) {
      arrayMove(temp, currentIndex, currentIndex - 1);
    } else {
      toast.warn('Room already at top of list');
    }
    setChannelList(temp);
  };

  const moveDown = (channel: ChannelDocument, currentIndex: number) => {
    let temp = [...channelList];
    if (currentIndex + 1 < temp.length) {
      arrayMove(temp, currentIndex, currentIndex + 1);
    } else {
      toast.warn('Room already at bottom of list');
    }
    setChannelList(temp);
  };

  const onReset = () => {
    setChannelList(channels);
  };

  const onSave = () => {
    const channelOrder : string[] = channelList.map((chan) => chan.id);
    const update : Partial<CommunityDocument> = {
      channel_order: channelOrder,
    };
    dispatch(updateCommunity({
      id: community.id, state: update,
    }));
  };

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
    <Layout title={CommunitySettingsTabs.Channels}>
      <Space direction='column' size='sm' />
      <h3>Reorder</h3>
      <Space direction='column' size='sm' />
      {
        channelList.map((chan, index) => {
          return (
            <ChannelOrderItem key={chan.id}>
              <ChannelOrderButton onClick={() => moveUp(chan, index)}> <Icon $solid as={UpArrow}/> </ChannelOrderButton>
              <ChannelOrderButton onClick={() => moveDown(chan, index)}> <Icon $clickable $solid as={DownArrow}/> </ChannelOrderButton>
              <Space />
              <ChannelItem
                key={chan.id}
                roomId={chan.id}
                channel={chan}
                locked={false}
                active={true}
                handler={() => {toast.info('Channels are not clickable while in settings');}}
                disableEdit
              />
            </ChannelOrderItem>
          );
        })
      }
      <Space direction='column' size='md'/>
      <Row $center $full>
        <ButtonLarge color="none" onClick={onReset}>Reset</ButtonLarge>
        <Space size='md'/>
        <ButtonLarge onClick={onSave}>Save</ButtonLarge>
      </Row>
    </Layout>
  );
};
export default Channels;
