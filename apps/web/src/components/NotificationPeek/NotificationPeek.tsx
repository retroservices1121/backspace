// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { MentionSource, NotificationType } from '@prisma/client';
import { viewPost } from '@src/store/postSlice';
import { User } from '@src/types/prisma';
import { Notification } from '@src/types/prisma';
import { timeAgoString } from '@src/utils/common_utils';
import { useRouter } from 'next/router';

import RenderNotif from 'components/NotificationPeek/components/notification';
import { RootState, useAppDispatch, useAppSelector } from 'store/store';
import { Row } from 'styles/Flex';
import { Space } from 'styles/layout';

import CloseIcon from '../../../public/graphics/commonicons/close.svg';
import { NotifType } from './components/notification';
import { ActionIcon, Container, Overlay } from './styles';

type Props = {
  open: boolean;
  onRequestClose: () => void;
};

const useNotification = () => {
  const notifications = useAppSelector((state: RootState) => state.user.notifications);
  const [notifs, setNotifs] = useState<Array<NotifType>>();

  useEffect(() => {
    const temp = notifications?.map((each) => {
      const user = getUserFromNotification(each);
      const tandt = getTitleAndTextFromNotification(each, user);
      const newNotif : NotifType = {
        title: tandt.title,
        text: tandt.text,
        timeAgo: timeAgoString(each.createdAt),
        user: getUserFromNotification(each),
        notification: each,
      };
      return newNotif;
    });
    setNotifs(temp);
  }, [notifications]);

  const getTitleAndTextFromNotification = 
    (notification: Notification, user: User) 
    : { title: string, text: string } => {
      switch (notification.type) {
        case NotificationType.MENTION:
          return {
            title: 'New Mention',
            text: `${user.name || user.username} mentioned you.`,
          };
        case NotificationType.FOLLOW:
          return {
            title: 'New Follow',
            text: `${user.name || `@${user.username}`} started following you.`,
          };
        default:
          return null;
          break;
      }
    };

  // Reference user for a notification can come from different objects
  const getUserFromNotification = (notification : Notification) => {
    switch (notification.type) {
      case NotificationType.MENTION:
        return notification.mention?.author;
      case NotificationType.FOLLOW:
        return notification.follow?.follower;
      default:
        return null;
        break;
    }
  };

  const markAllRead = () => {
    throw new Error('Not implemented');
  };

  return {
    notifications : notifs,
    markAllRead,
  };
};

const NotificationsPeek: React.FC<Props> = ({ open, onRequestClose }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const notifs = useNotification();

  const processClick = (notification: Notification) => {
    switch (notification.type) {
      case NotificationType.MENTION:
        switch (notification.mention?.type) {
          case MentionSource.POST:
            toast.info('Fetching post, please wait...');
            dispatch(viewPost(notification.mention.postId));
            onRequestClose();
            break;
          default:
            break;
        }  
        
        break;
      case NotificationType.FOLLOW: 
        const username = notification.follow?.follower?.username;
        if (username) {
          router.push(username);
          onRequestClose();
        } else {
          toast.error('Unable to navigate to user');
        }
        
      default:
        break;
    }

    // const username = notification.username;

    // switch (notification.type) {
    //   case NotificationType.Post:
    //     //This is unmaintainable code, update with global
    //     const postId = notification.ref.id;
    //     router.push(`/?post=${postId}`);
    //     break;
    //   case NotificationType.Direct:
    //     dispatch(setConversationFromUid(notification.uid));
    //     router.push(APP.MESSAGES.INDEX);
    //     break;
    //   case NotificationType.Follow:
    //   case NotificationType.Member:
    //   default:
    //     if (username && username.length > 0) {
    //       router.push(username);
    //       onRequestClose();
    //     } else {
    //       toast.error('Error navigating to user');
    //     }
    //     break;
    // }
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
          {notifs.notifications?.map((notif) => {
            if (notif) {
              return (
                <Row>
                  <RenderNotif 
                    notification={notif} 
                    onClick={() => processClick(notif.notification)}/>
                </Row>
              );
            } else {
              return <></>;
            }
            
          })}
        </div>

      </Container>
    </>

  
  );
};

export default NotificationsPeek;
