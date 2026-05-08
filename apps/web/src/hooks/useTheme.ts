// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History


import { createSelector } from '@reduxjs/toolkit';

import { RootState, useAppSelector } from 'store/store';
import { themes } from 'styles/theme';

const selectThemeName = (state: RootState) => state.app.theme;
const selectTheme = createSelector(selectThemeName, theme => themes[theme]);


/** You probably wanna use this like this `const { themeName, ...theme } = useTheme();` */
export default function useTheme() {
  const themeName = useAppSelector(selectThemeName);
  const themeProps = useAppSelector(selectTheme);

  return { ...themeProps, themeName };
}
