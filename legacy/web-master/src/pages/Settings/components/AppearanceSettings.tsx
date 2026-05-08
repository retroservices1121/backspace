// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getThemeButtonText } from 'shared/common_utils';
import { toggleTheme } from 'store/appSlice';
import { RootState } from 'store/store';
import { HorizontalLine } from 'styles/Dividers';
import { Themes } from 'styles/theme';

import { AppearanceButton } from './AppearanceButton';
import { Tabs } from './common';

type Props = {};

export const AppearanceSettings: React.FC<Props> = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.app.theme);

  const switchTheme = (newTheme: Themes) => {
    dispatch(toggleTheme(newTheme));
  };

  return (
    <>
      <h2>{Tabs.Appearance}</h2>
      <HorizontalLine />
      <h3 className="mt-8"> Backspace Theme: </h3>
      <div className="grid sm:grid-cols-2 gap-12 my-8">
        <AppearanceButton
          text={getThemeButtonText(Themes.Dark)}
          theme={theme}
          themes={Themes}
          mode={Themes.Dark}
          onClick={switchTheme}
        />
        <AppearanceButton
          text={getThemeButtonText(Themes.Light)}
          theme={theme}
          themes={Themes}
          mode={Themes.Light}
          onClick={switchTheme}
        />
      </div>
      <HorizontalLine />
    </>
  );
};
