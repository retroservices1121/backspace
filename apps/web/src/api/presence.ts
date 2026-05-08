// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { getDatabase, onDisconnect, onValue, push, ref, serverTimestamp, set } from 'firebase/database';

//import IdleJs from 'idle-js';
import { OnlinePresence } from 'types/documents';

//TODO consider idle-js or similar to round out this feature
export function setConnected(uid: string) {
  const IdleJs = require('idle-js');
  console.log('Establishing Connected Status');
  // Since I can connect from multiple devices or browser tabs, we store each connection instance separately
  // any time that connectionsRef's value is null (i.e. has no children) I am offline
  const db = getDatabase();
  const myConnectionsRef = ref(db, `users/${uid}/connections`);

  // stores the timestamp of my last disconnect (the last time I was seen online)
  const lastOnlineRef = ref(db, `users/${uid}/lastOnline`);
  const connectedRef = ref(db, '.info/connected');

  const onlineStatusRef = ref(db, `users/${uid}/onlineStatus`);
  const handleOnIdle = () => {
    set(onlineStatusRef, OnlinePresence.Idle);
  };

  const handleOnActive = () => {
    set(onlineStatusRef, OnlinePresence.Online);
  };

  const handleOnAway = () => {
    set(onlineStatusRef, OnlinePresence.Away);
  };

  var idle = new IdleJs({
    idle: 60 * 1000, // idle time in ms
    events: ['mousemove', 'keydown', 'mousedown', 'touchstart'], // events that will trigger the idle resetter
    onIdle: handleOnIdle, // callback function to be executed after idle time
    onActive: handleOnActive, // callback function to be executed after back form idleness
    onHide: handleOnAway, // callback function to be executed when window become hidden
    onShow: handleOnActive, // callback function to be executed when window become visible
    keepTracking: true, // set it to false if you want to be notified only on the first idleness change
    startAtIdle: true, // set it to true if you want to start in the idle state
  });
  idle.start();


  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      // We're connected (or reconnected)! Do anything here that should happen only if online (or on reconnect)
      const con = push(myConnectionsRef);
      handleOnActive();
      // When I disconnect, remove this device
      onDisconnect(con).remove();

      // Add this device to my connections list
      // this value could contain info about the device or a timestamp too
      set(con, true);

      // When I disconnect, update the last time I was seen online
      onDisconnect(lastOnlineRef).set(serverTimestamp());
      onDisconnect(onlineStatusRef).set(OnlinePresence.Offline);
    }
  });

}
