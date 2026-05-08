// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled, { css } from 'styled-components';

import constants, { Icon, mediaQuery } from 'styles/Globals';

type ContainerProps = {
  show: boolean;
};


export const Overlay = styled.div<ContainerProps>`
  //this is not a visable overlay, but let's us close the Container on click
  position: absolute;
  width: 100vw;
  min-width: 100vw;
  min-height: 100vh;
  top: 0;
  left: 0;
  
  visibility: hidden;
  ${({ show }) => show && css`
    visibility: visible;
  `}
`;

export const Container = styled.div<ContainerProps>`
  position: fixed;
  top: calc(${constants.NAVIGATION_HEIGHT} + 10px);
  width: 386px;
  max-width: 100vw;
  min-height: 717px;
  max-height: calc(100vh - ${constants.NAVIGATION_HEIGHT});
  background-color: ${({ theme }) => theme.backgroundNormal};

  border-radius: 20px;
  border: 2px outset ${({ theme }) => theme.backgroundDark};
  //Box shadow fucks up the 'click off'
  /* box-shadow: 0px 15px 10px rgba(13, 13, 13, 0.5); */
  text-align: left;

  padding: 25px 20px 20px;

  padding: 25px 10px 10px;
  z-index: 1;

  visibility: hidden;
  ${({ show }) => show && css`
    visibility: visible;
  `}

  ${mediaQuery.sm} {
    position: fixed;
    bottom: 80px;
    overflow: hidden;
    min-height: 500px;
    min-width: 100vw;
  border: 2px solid ${({ theme }) => theme.backgroundLight};
  }
`;

export const NotificationIndicator = styled.div`
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.error};
  margin: auto;
`;

export const ActionIcon = styled(Icon)`
  position: absolute;
  top: 10px;
  right: 10px;
`;
