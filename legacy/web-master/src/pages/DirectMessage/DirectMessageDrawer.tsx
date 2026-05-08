//import { useState, useEffect } from "react";
import Loading from 'react-loading';
import { useDispatch, useSelector } from 'react-redux';

import { ConversationUnion } from 'api/DirectMessageAPI';
import ConversationList from 'components/ConversationList';
import MobileDrawer from 'components/DrawerV2';
import Search from 'components/Search';
import { toggleDrawer } from 'store/appSlice';
import { changeConversation, setConversationFromUid } from 'store/directMessageSlice';
import { RootState } from 'store/store';

import { DrawerHeader } from './styled';


export default function DirectMessageDrawer() {
  const conversations = useSelector((state : RootState) => state.directMessage.conversations);
  const activeConversation = useSelector((state : RootState) => state.directMessage.activeConversation);
  const dispatch = useDispatch();

  const generateConversations = (list: ConversationUnion[]) => {
    if (!list) return <div>Search for a user to begin a conversation</div>;
    return list.map((convo) => {
      return (
        <ConversationList
          key={`convo-${convo.other_uid}`}
          active={activeConversation?.other_uid === convo.other_uid}
          conversation={convo}
          handler={() => {
            dispatch(changeConversation(convo));
            if (window.innerWidth <= 760) {
              dispatch(toggleDrawer());
            }
          }}/>
      );
    });
  };

  return (
      <MobileDrawer>
        <>
        <DrawerHeader>
          <Search callbackText={null} callback={(selectedUser) => dispatch(setConversationFromUid(selectedUser.id))}/>
        </DrawerHeader>
        {!conversations && (
          // The usual better than nothing spinner
          <div style={{ position: 'relative', left: '50%' }}>
            <Loading type='spinningBubbles' height={0} width={25} />
          </div>
        )}
        {generateConversations(conversations)}
        </>
      </MobileDrawer>
  );
}

