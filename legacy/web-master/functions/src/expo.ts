// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import * as functions from 'firebase-functions';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { NotificationDocument, NotificationType } from '../../src/shared/types/documents';

export const expo = new Expo({ accessToken: functions.config().expo.access_token });

const buildNotification = (notif : NotificationDocument) => {
  try {
    switch (notif.type) {
      /** New Follow */
      case NotificationType.Follow:
        return 'New Follow';
      /** New Direct Message */
      case NotificationType.Direct:
        return 'New Direct Message';
      /** New Post Mention */
      case NotificationType.Post:
        return  'New Post Mention';
      /** New Channel Mention */
      case NotificationType.Channel:
        return  'New Community Mention';
      default:
        return undefined;
    }
  } catch (e) {
    console.error(e);
    return undefined;
  }
};

export const sendPushNotification = (pushTokens: string[], notification: NotificationDocument) => {

  let messages : ExpoPushMessage[] = [];
  pushTokens.forEach((pushToken) => {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
    } else {
      let notificationText = buildNotification(notification);
      if (notificationText) {
        messages.push({
          to: pushToken,
          sound: 'default',
          title: 'Backspace',
          body: notificationText,
          data: { withSome: 'data' },
        });
      } else {
        console.log('No Push Notif generated');
      }
    }
  });

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
      } catch (error) {
        console.error(error);
      }
    }
  })();

  
};