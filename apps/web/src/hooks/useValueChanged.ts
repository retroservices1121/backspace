// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useState } from 'react';
import { isEqual } from 'lodash';

/** Returns true if value has changed since last re-render */
export default function useValueChanged(value: any) {
  const [previous, setPrevious] = useState(value);

  if (!isEqual(previous, value)) {
    setPrevious(value);
    return true;
  }

  return false;
}
