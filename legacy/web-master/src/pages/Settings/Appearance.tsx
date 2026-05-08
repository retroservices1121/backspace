// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { AppearanceSettings } from './components/AppearanceSettings';
import { Container } from './styled';

const Appearance: React.FC<any> = () => {
  return (
    <Container>
      <AppearanceSettings />
    </Container >
  );
};
export default Appearance;
