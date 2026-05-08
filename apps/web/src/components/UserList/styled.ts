import styled from 'styled-components';

import { mediaQuery } from 'styles/Globals';

export const ListItem = styled.div`
  width: 100%;
  margin: 10px;
  padding-bottom: 10px;
  border-bottom: 0.5px solid ${({ theme }) => theme.backgroundLight};
`;

export const ListContainer = styled.ul`
  background-color: ${({ theme }) => theme.backgroundMedium};
  width: 850px;
  padding: 20px 40px;
  border-radius: 25px;
  ${mediaQuery.md} {
    width: 100%;
  }
`;
