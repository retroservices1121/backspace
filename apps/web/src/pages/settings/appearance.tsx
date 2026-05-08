// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { ReactLayoutComponentType } from 'react-layout';
import settingsLayout from 'layouts/settingsLayout';

import { AppearanceSettings } from 'components/Settings/AppearanceSettings';
import { Container } from 'components/Settings/styledAgain';

const Appearance: ReactLayoutComponentType = () => {
  return (
    <Container>
      <AppearanceSettings />
    </Container >
  );
};

Appearance.Layout = settingsLayout;

export default Appearance;

//FIXME: Dylan I need yo help!!
// Appearance.Layout = settingsLayout;
