// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect } from 'react';

export default function useAsyncEffect(
  watcher: any[],
  callback: () => Promise<void>,
  // Normally returned by callback, but since this is async, we need to do this.
  destroy: (() => Promise<void>) | null = null,
) {
  useEffect(() => {
    callback();

    if (destroy) {
      return () => {
        destroy();
      };
    }
  }, watcher);
}