// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { markNotificationRead } from 'api/notifications';
import { AvatarTypes } from 'components/Avatar/Avatar';
import { AvatarHeader } from 'components/UserHeader';
import { ReactComponent as CloseIcon } from 'graphics/commonicons/close.svg';
import useRouting from 'hooks/useRouting';
import { showNotification } from 'lib/notification';
import { APP } from 'pages';
import { NotificationType } from 'shared/types/documents';
import { setConversationFromUid } from 'store/directMessageSlice';
import { NotificationInfo, setUnreadIndicator } from 'store/notificationsSlice';
import { RootState } from 'store/store';
import { Row } from 'styles/Flex';
import { Space } from 'styles/layout';

import { ActionIcon, Container, NotificationIndicator, Overlay } from './styles';

type Props = {
  open: boolean;
  onRequestClose: () => void;
};

const NotificationsPeek: React.FC<Props> = ({ open, onRequestClose }) => {
  const history = useRouting();
  const dispatch = useDispatch();
  const { recent } = useSelector((state: RootState) => state.notifications);
  const { id: uid } = useSelector((state: RootState) => state.user);
  const previousNotifications = useRef<NotificationInfo>();

  const markRead = (notif: NotificationInfo) => {
    if (!notif.read) {
      markNotificationRead(uid, notif.id);
    }
  };

  useEffect(() => {
    if (open) {
      dispatch(setUnreadIndicator(false));
      recent.map((value) => markRead(value));
    }
  }, [open]);

  //TODO combine with firebase messagaes
  // Plays notification sound in the right conditions
  useEffect(() => {
    if (recent && recent.length > 0) {
      // recent has been updated (and is not new) and is unread
      if (
        previousNotifications.current?.timestamp != recent[0].timestamp
        && !recent[0].read
      ) {
        switch (recent[0].type) {
          case NotificationType.Post:
          case NotificationType.Channel:
          case NotificationType.Direct:
            showNotification(`${recent[0].title} ${recent[0].description}`);
            break;
          case NotificationType.Follow:
            break;
          default:
            break;
        }
      }
      previousNotifications.current = recent[0];
    }
    
  }, [recent]);

  const processClick = (notification: NotificationInfo) => {
    const username = notification.username;

    switch (notification.type) {
      case NotificationType.Post:
        //This is unmaintainable code, update with global 
        const postId = notification.ref.id;
        history.navigate(`/?post=${postId}`);
        break;
      case NotificationType.Direct:
        dispatch(setConversationFromUid(notification.uid));
        history.navigate(APP.MESSAGES.INDEX);
        break;
      case NotificationType.Follow:
      case NotificationType.Member:
      default:
        if (username && username.length > 0) {
          history.navigateToProfile(username);
          onRequestClose();
        } else {
          toast.error('Error navigating to user');
        }
        break;
    }
  };

  return (
    <>
      <Overlay show={open} onClick={onRequestClose}/>
      <Container show={open}>
        <ActionIcon $solid $clickable as={CloseIcon} $color='fontTertiary' onClick={onRequestClose} />
        <h3>Notifications</h3>
        <Space direction='column' />

        {/* TODO: Not perfect but it works, the scrollbar gets overflows */}
        <div className="flex flex-col max-h-full overflow-y-auto pb-[50px]">
          {recent?.map((notif) => {
            return (
              <Row key={notif.id}>
                <AvatarHeader
                  type={AvatarTypes.Profile} 
                  image={notif.image} 
                  title={notif.title} 
                  subtitle={notif.description}
                  onClick={() => processClick(notif)}
                  onHover={() => markRead(notif)}
                />
                {!notif.read && <NotificationIndicator />}
              </Row>
            );
          })}
        </div>

      </Container>
    </>

  
  );
};

export default NotificationsPeek;
