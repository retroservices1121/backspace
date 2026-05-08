// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Styling
import styled from 'styled-components';

import { OldCol } from 'styles/Flex';
import { Icon } from 'styles/Globals';


type ContainerProps = {
  url? : string;
};

const tileSize = '230px';
export const Container = styled.div<ContainerProps>`
  position: relative;
  cursor: pointer;
  width: ${tileSize};
  max-width: 40vw;
  height: ${tileSize};
  max-height: 40vw;

  margin: 10px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.backgroundNormal};
  
  background-image: url(${({ url }) => url});
  background-position: center;
  background-size: cover;
  background-color: ${({ theme }) => theme.backgroundNormal};
`;

export const Overlay = styled(OldCol)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0; 
  bottom: 0;
  width: 100%;
  height: 100%;
  visibility: hidden;
  background-color: rgba(0,0,0,0.7);
  border-radius: inherit;
  ${Container}:hover & {
    visibility: visible;
  }
  text-align: center;
`;

export const OverlayIcon = styled(Icon)`
  margin: 5px;
`;

export const PostTitle = styled.h3`
  overflow-wrap: break-word;
  height: fit-content;
  width: inherit;
  max-width: inherit;
  max-height: 100%;
  text-align: center;
  padding: 10px;
`;
