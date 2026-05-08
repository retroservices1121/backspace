// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useRef } from 'react';
import logEvent, { Screens } from '@src/lib/events';

export default function useAnalytics(event: string, params: object) {
  const isConstructor = useRef(true);
  if (isConstructor.current) {
    isConstructor.current = false;
    logEvent(event, params);
  }
}

export function useScreen(screen: Screens) {
  useAnalytics('screen_view', {
    firebase_screen: screen,
  });
}

export { Screens } from '@src/lib/events';