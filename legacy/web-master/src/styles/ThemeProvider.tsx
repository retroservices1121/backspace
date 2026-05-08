// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useSelector } from 'react-redux';
import { ThemeProvider as StyledProvider } from 'styled-components';

import useSassTheme from 'hooks/useSassTheme';
import { getTheme } from 'store/selectors';
import GlobalStyle from 'styles/globalStyle';

const ThemeProvider: React.FC = ({ children }) => {
  const currentTheme = useSelector(getTheme);
  useSassTheme(currentTheme);

  return (
    <StyledProvider theme={currentTheme}>
      <GlobalStyle/>
      {children}
    </StyledProvider>
  );
};
export default ThemeProvider;
