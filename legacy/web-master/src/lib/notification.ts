// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import Logo from 'graphics/branding/logo-blueonwhite.jpeg';
import { defaultPing } from 'util/sounds';

//Checks if Notifications are supported
const isSupported = () =>
  'Notification' in window &&
'serviceWorker' in navigator &&
'PushManager' in window;

export function authorizeNotifications() {
  if (isSupported()) {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

export function showNotification(text: string, sound: boolean = true) {
  const notifOptions : NotificationOptions = {
    body: text,
    icon: Logo,
  };
  if (isSupported()) {
    try {
      if (sound) defaultPing();
      return new Notification('Backspace Notification', notifOptions);
    } catch (error) {
      console.error('Notifications not support in this browser', error);
    }
  } else {
    return;
  }
}