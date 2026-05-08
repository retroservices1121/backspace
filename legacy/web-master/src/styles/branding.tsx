// import React from 'react';
import styled, { css } from 'styled-components';

import { ReactComponent as LogoSVG } from 'graphics/navigation/logo_banner_white.svg';

import { makeIcon } from '../icons';

// https://styled-components.com/docs/api#transient-props
type LogoProps = {
  $banner?: boolean;
  onClick?: () => void;
};

const StyledLogo = styled.svg<LogoProps>`
  ${({ $banner }) => $banner && css`
    height: 36px;
    fill: ${({ theme }) => theme.primary};
  `}
  margin: 10px 0px 20px 0px;
  margin-left: -8px;
  &:hover {
    filter: brightness(1.1);
    cursor: pointer;
  }
`;

export const Logo = makeIcon(LogoSVG, StyledLogo);
