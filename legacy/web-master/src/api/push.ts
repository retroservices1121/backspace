// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { UserTable } from './userAPI';

//Push notification logic

export async function setPushToken(uid: string, token: string = '') {
  let pushToken = '';
  //If not supplied
  if (!token) {
    //Grab push token from local storage (iframe app support)
    pushToken = localStorage.getItem('pushToken') || '';
  }

  //Put push token in firebase
  if (pushToken) {
    UserTable.updateDoc(uid, { pushToken: pushToken });
  }
}
