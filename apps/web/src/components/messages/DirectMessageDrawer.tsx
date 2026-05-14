// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import Loading from 'react-loading';
import useConversations from '@src/hooks/useConversations';

import ConversationItem from 'components/ConversationList';
import Drawer from 'components/Drawer';
import Icons from 'icons';
import { ClickableSpan } from 'styles/Buttons';
import constants from 'styles/Globals';
import { Space } from 'styles/layout';
import { Conversation } from 'types/prisma';

export default function DirectMessageDrawer() {
  const { conversations, actions, activeId } = useConversations();

  const handleConversationClick = (id: bigint) => () => {
    actions.changeConversation(id);
    // Below the sm breakpoint the drawer is a fixed overlay — close it
    // on selection so the conversation pane is visible.
    if (window.innerWidth <= parseInt(constants.SMALLSCREEN_WIDTH, 10)) {
      actions.toggleDrawer();
    }
  };

  return (
  <Drawer title={'Direct Messages'}>
    <div className='col w-full justify-between items-center py-3 px-10'>
      <ClickableSpan onClick={actions.newConversation}>
        <div className='row center m-2 justify-between'>
          <Icons.PlusBox color='primary'/>
          <span className='pl-6'>New Conversation</span>
        </div>
      </ClickableSpan>
      {/* <Search callbackText={null} callback={(selectedUser) => 
        dispatch(setConversationFromUid(selectedUser.id))
      }/> */}
    </div>
    {!conversations && (
      // The usual better than nothing spinner
      <div className='relative left-1/2'>
        <Loading type='spinningBubbles' height={0} width={25} />
      </div>
    )}
    {Object.values(conversations)?.map(convo => (
      <ConversationItem
        key={`convo-${convo.id}`}
        active={activeId === convo.id}
        conversation={convo as Conversation}
        handler={handleConversationClick(convo.id)}
      />
    ))}
  </Drawer>
  );
}

