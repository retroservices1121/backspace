// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Styling

import styled, { css, DefaultTheme } from 'styled-components';

import { OnlinePresence } from 'types/documents';

type ImageProps = {
  size : number;
  circle?: boolean;
};

type IndicatorProps = {
  online: OnlinePresence;
};

export const Container = styled.div<ImageProps>`
  position: relative;
  background-color: ${({ theme }) => theme.backgroundNormal};
  border-radius: 10%;
  border: 1px solid ${({ theme }) => theme.backgroundNormal};
  width: ${({ size }) => `${size}px`};
  min-width: ${({ size }) => `${size}px`}; // required due to flex
  height: ${({ size }) => `${size}px`};
  min-height: ${({ size }) => `${size}px`}; // required due to flex
  ${({ circle }) => circle && css`
    border-radius: 50%;
  `}
`;

export const AvatarImg = styled.img`
  object-position: center;
  object-fit: cover;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  border-radius: inherit;
`;

const onlineTranslator = (value : OnlinePresence, theme : DefaultTheme) : string => {
  switch (value) {
    case OnlinePresence.Online:
      return 'LimeGreen';
    case OnlinePresence.Busy:
      return 'Maroon';
    case OnlinePresence.Away:
    case OnlinePresence.Idle:
      return 'Gold';
    case OnlinePresence.Invisible:
    case OnlinePresence.Offline:
    default:
      return theme.backgroundDark;
  }
};

export const OnlineIndicator = styled.div<IndicatorProps>`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  border: 2px outset ${({ theme }) => theme.backgroundLight};
  background-color: ${({ online, theme }) => onlineTranslator(online, theme)}
`;
