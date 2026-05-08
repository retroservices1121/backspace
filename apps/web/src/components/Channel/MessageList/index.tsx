// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { useRef } from 'react';
import { ChannelType } from '@prisma/client';
import { throttle } from 'lodash';

import Message from 'components/Community/Message';
import { InfiniteListFull } from 'components/core/InfiniteList';
import ListTransition from 'components/ListTransition';
import useChannel from 'hooks/entities/useChannel';

import DateTransition, { DateEquality } from './DateTransition';


type Props = {
  channelId: string;
};

const MessageList: React.FC<Props> = ({ channelId }) => {
  const { channel, run } = useChannel(channelId);
  const dateRef = useRef(new Date(null));  

  const paginate = throttle(run.loadMore, 1000);

  return (
    <InfiniteListFull list={channel.messages} paginate={paginate} canPaginate={channel.canPaginate} reversed>
      {(msg, index) => (
        <div key={msg.uuid}>
          <ListTransition
            previous={dateRef}
            current={new Date(msg.createdAt)}
            equality={DateEquality}
            children={DateTransition}
          />
          <Message grid={channel.type === ChannelType.LIBRARY} index={index} message={msg} />
        </div>
      )}
    </InfiniteListFull>
  );
};

export default MessageList;
