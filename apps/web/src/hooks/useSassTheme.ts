// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useEffect, useRef } from 'react';
import { DefaultTheme } from 'styled-components';

/** @deprecated */
export default function useSassTheme(theme: DefaultTheme) {
  const ref = useRef(false);
  useEffect(() => {
    if (!ref.current) {
      for (const value in theme) {
        document.documentElement.style.setProperty(`--${value}`, theme[value]);
      }
      ref.current = true;
    }
  }, []);
  useEffect(() => {
    for (const value in theme) {
      document.documentElement.style.setProperty(`--${value}`, theme[value]);
    }
  }, [theme]);
}
