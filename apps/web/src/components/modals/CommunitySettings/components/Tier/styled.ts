// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled from 'styled-components';

export const Container = styled.div`
  border-radius: .4em;
  border: 2px solid ${({ theme }) => theme.backgroundLight};
  padding: 2em;
  margin-bottom: 1.5em;
`;

export const Perks = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-gap: 10px;
`;