// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import logEvent, { Screens } from 'lib/events';

import useConstructor from './useConstructor';

export default function useScreen(screenName: Screens) {
  useConstructor(() => logEvent('screen_view', { firebase_screen: screenName }));
}
