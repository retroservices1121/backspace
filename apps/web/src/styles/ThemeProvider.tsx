// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { ThemeProvider as StyledProvider } from 'styled-components';

import useSassTheme from 'hooks/useSassTheme';
import useTheme from 'hooks/useTheme';
import GlobalStyle from 'styles/globalStyle';

const ThemeProvider: React.FC = ({ children }) => {
  // We're not using themeName, but destructuring it like this removes it from the theme.
  // eslint-disable-next-line
  const { themeName, ...theme } = useTheme();
  useSassTheme(theme);

  return (
    <StyledProvider theme={theme}>
      <GlobalStyle/>
      {children}
    </StyledProvider>
  );
};
export default ThemeProvider;
