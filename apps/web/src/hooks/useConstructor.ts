// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useRef } from 'react';

export default function useConstructor(callback: () => void) {
  const isConstructor = useRef(true);
  if (isConstructor.current) {
    isConstructor.current = false;
    return callback();
  }
}