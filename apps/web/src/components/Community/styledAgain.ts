// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled from 'styled-components';

import { OldRow } from 'styles/Flex';

export const Container = styled(OldRow)`
  height: 100%;
  width: 100%;
  max-height: 100%;
  // The drawers inside (CommunityDrawer / MemberList) go position:fixed
  // below the sm breakpoint, so on mobile this row's only in-flow child
  // is the channel feed — which then gets the full viewport width.
  overflow-x: hidden;
  background-color: ${({ theme }) => theme.backgroundDark};
`;

export const TextHighlight = styled.span`
  margin: 0px 5px;
  font-weight: bold;
  color: ${({ theme }) => theme.primary};
`;

