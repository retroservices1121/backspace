import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Timestamp } from 'firebase/firestore';

import { getMoreMessages, sendDirectMessage, updateReadCount } from 'api/DirectMessageAPI';
import Header from 'components/Header';
import MessageList from 'components/MessageList';
import { HideOnMobile } from 'components/NavigationV2/styled';
import ChatInput from 'components/Rich/ChatInput';
import placeholderProfile from 'graphics/placeholders/1.png';
import useRouting from 'hooks/useRouting';
import { logEventScreen, Screens } from 'lib/events';
import { Container as ListContainer } from 'pages/Community/components/styled';
import { DirectMessageDocument, MediaType, MessageType, OnlinePresence } from 'shared/types/documents';
import { setPageTitle } from 'store/appSlice';
import { setHasMoreMessages, setMoreMessages } from 'store/directMessageSlice';
import { RootState } from 'store/store';
import { User } from 'store/userSlice';
import { Col } from 'styles/Flex';

import DesktopDirectMessageDrawer from './DesktopDirectMessageDrawer';
import DirectMessageDrawer from './DirectMessageDrawer';
import { Container } from './styled';

type Props = {};

const DirectMessage: React.FC<Props> = ({}) => {
  const dispatch = useDispatch();
  const uid = useSelector((state : RootState) => state.user.id);
  const conversations = useSelector((state : RootState) => state.directMessage.conversations);
  const activeConversation = useSelector((state : RootState) => state.directMessage.activeConversation);
  const messages = useSelector((state : RootState) => state.directMessage.activeMessages);
  const moreMessages = useSelector((state : RootState) => state.directMessage.moreMessages);
  const hasMore = useSelector((state : RootState) => state.directMessage.hasMoreMessages);
  const { onlineStatus } = useSelector((state: RootState) => state.users);
  const history = useRouting();
  logEventScreen(Screens.Messages);
  useEffect(() => {dispatch(setPageTitle('Messages'));}, []);
  

  const loadMore = async () => {
    const increments : number = 20;
    await getMoreMessages(activeConversation, moreMessages.length + increments || increments).then((result) => {
      console.log(result);
      if (result?.length > 0 && result?.length > moreMessages.length) {
        dispatch(setMoreMessages(result));
      }
      //If not evenly divisble by increments, we ran out of messages
      if (result?.length % increments != 0) {
        console.log('No more to fetch');
        dispatch(setHasMoreMessages(false));
      }
    });
    return;
  };

  const sendMessage = async (text: string, media : File | undefined) => {
    //TODO Add alert here that content is required
    if (!text && !media) return;
    let temp : DirectMessageDocument = {
      type: MessageType.Direct,
      sender: uid,
      recipient: activeConversation.other_uid,
      text: text,
      timestamp: Timestamp.now(),
      media: '',
      media_type: MediaType.Image,
    };
    sendDirectMessage(temp, media);

  };

  useEffect(() => {
    //TODO I'm not sure the read count should be tracked in a use effect
    if (conversations && activeConversation && uid) {
      const convo = conversations.find((element) => element.other_uid === activeConversation.other_uid);
      if (convo) {
        updateReadCount(convo);
      }
    }
  }, [ conversations, activeConversation ]);

  const goToUser = (user: User) => {
    if (user.username && user.username.length > 0) {
      history.navigateToProfile(user.username);
    } else {
      toast.warn('Sorry there was an error routing to this user.');
    }
  };


  return (
    <Container>

      <DirectMessageDrawer/>
      <HideOnMobile>
        <DesktopDirectMessageDrawer/>
      </HideOnMobile>

      <Col $full>
        {activeConversation?.other &&
        <Header
          onClick={() => goToUser(activeConversation.other)}
          title={activeConversation?.other.display_name || activeConversation?.other.username || 'Conversation'}
          image={activeConversation?.other.avatar || placeholderProfile}
          verified={activeConversation?.other.verified || false}
          description={onlineStatus.get(activeConversation?.other.id) || (uid === activeConversation?.other.id ? OnlinePresence.Online : activeConversation?.other.online)} />
        }
        {/* Chat Messages will render here */}
        {activeConversation &&
        <>
          <ListContainer>
            <MessageList
              messages={messages}
              loadMoreMessages={moreMessages}
              initialPosition={'bottom'}
              hasMore={hasMore}
              loadMore={() => loadMore()}
              showDateChange
            />
          </ListContainer>
          {activeConversation?.other &&
            <ChatInput allowMedia={true} onSubmit={(text, media) => sendMessage(text, media)}/>
          }
        </>
        }
      </Col>
    </Container>
  );
};

export default DirectMessage;
