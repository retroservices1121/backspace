// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import cookie from 'js-cookie';

export const authTokenName = 'firebaseToken';

export const getAuthCookie = () => {
  return cookie.get(authTokenName);
};

export const setAuthCookie = (token) => {
  cookie.set(authTokenName, token, { expires: 14 });
};

export const removeAuthCookie = () => {
  cookie.remove(authTokenName);
};