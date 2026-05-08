// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { getFunctions, httpsCallable } from 'firebase/functions';

import logEvent, { EventMessages } from 'lib/events';

export const submitAccessCode = (code: string) => {
  logEvent(EventMessages.User.AccessCodeSubmit);
  const functions = getFunctions();
  const fbFunction = httpsCallable(functions, 'submitAccessCode');
  return fbFunction(code)
    .catch((error) => {console.error(error); throw new Error('FailedSubmitAccessCode');});
};