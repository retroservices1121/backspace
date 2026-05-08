// Copyright 2021 NewSocial Inc.
// Author(s): Brenton Beltrami
// Description: Styling
import styled from 'styled-components';
import tw from 'twin.macro';

import Zindex from 'styles/zindex';

export const Content = styled.div`
  background: ${({ theme }) => theme.backgroundDark};
`;

export const DrawerContainer = styled.div`
  ${tw`fixed h-full overflow-auto`}
  z-index: ${Zindex.Drawer};
`;

export const DrawerContent = styled.div`
  z-index: ${Zindex.Drawer};
  ${tw`h-screen flex flex-col w-screen`}
`;
