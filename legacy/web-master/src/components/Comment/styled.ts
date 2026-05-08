// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford, Brenton Beltrami
// Description: Styling

import styled from 'styled-components';

export const DisplayName = styled.span`
  font-weight: bold;
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.fontPrimary};
`;

export const TimeContainer = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.fontSecondary};
  margin: 0px 10px;
`;

