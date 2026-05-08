import styled from 'styled-components';

import { mediaQuery } from 'styles/Globals';

export const OptionsLabel = styled.label`
  font-weight: normal;
  color: ${({ theme }) => theme.fontSecondary};
`;

export const SwapFormSpan = styled.span`
  font-size: 16px;
  line-height: 24px;
  color: var(--fontTertiary);

  span {
    color: var(--fontFocus);
    font-weight: bold;
  }
`;


export const AuthMain = styled.div`
  background: ${({ theme }) => theme.backgroundNormal};
  width: 100%;
  min-width: 300px;
  max-width: 700px;
  padding: 50px;
  ${mediaQuery.sm}{
    padding: 20px;
  }
`;

export const AuthAside = styled.aside`
  background: ${({ theme }) => theme.backgroundMedium};

  //Hide lottie-player if on mobile
  ${mediaQuery.sm} {
    display: none;
  }

  //Allows lottie to be auto scaled
  lottie-player {
    position: absolute;
    top: -9999px;
    left: -9999px;
    right: -9999px;
    bottom: -9999px;
    margin: auto;
  }
`;

export const Legal = styled.div`
  text-align: left;
  color: ${({ theme }) => theme.fontTertiary};

  span {
    font-size: 14px;
    line-height: 20px;
    color: ${({ theme }) => theme.fontPrimary};
    text-decoration: underline;
  }
`;

export const SSO = styled.div`
  border-color: ${({ theme }) => theme.backgroundLight};
  &:hover {
    background-color: ${({ theme }) => theme.backgroundLight};
  }
  span {
    color: ${({ theme }) => theme.fontPrimary};
    font-weight: bold;
    font-size: 2rem;
  }
`;

