// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect } from 'react';
import Head from 'next/head';

import Conversation from 'components/messages/Conversation';
import DirectMessageDrawer from 'components/messages/DirectMessageDrawer';
import { useScreen } from 'hooks/useAnalytics';
import { Screens } from 'lib/events';

const Messages: React.VFC = () => {
  useScreen(Screens.Messages);

  useEffect(() => {
    // const runTimer = setTimeout(() => console.log(socket.connectionState()), 5000 );
    // setTimeout(() => console.log(socket.channels), 1000);
    // setTimeout(() => console.log(socket.channels), 3000);
    // setTimeout(() => console.log(socket.channels), 5000);

    // var channel = socket.channel('*');
    // channel.on('*', undefined, msg => {
    //   console.log(msg);
    // });
  }, []);

  return (
    <div className='flex flex-row justify-start h-full w-full bg-backgroundNormal'>
      <Head><title>Messages</title></Head>
      <DirectMessageDrawer/>
      <Conversation />
    </div>
  );
};

export default Messages;
