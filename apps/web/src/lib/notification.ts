// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { defaultPing } from 'utils/sounds';

import Logo from '../../public/graphics/branding/logo-blueonwhite.jpeg';

//Checks if Notifications are supported
let isSupported = () => {return false;};
if (typeof window === undefined) {
  isSupported = () => 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

export function authorizeNotifications() {
  if (typeof window !== undefined && isSupported()) {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

export function showNotification(text: string, sound: boolean = true) {
  const notifOptions : NotificationOptions = {
    body: text,
    //@ts-ignore FIXME: Logo is returning static image data
    icon: Logo,
  };
  if (typeof window !== undefined && isSupported()) {
    if (sound) defaultPing();
    return new Notification('Backspace Notification', notifOptions);
  } else {
    return;
  }
}
