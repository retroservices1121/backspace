import styled from 'styled-components';
import tw from 'twin.macro';

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
  ${tw`text-left flex flex-col w-full min-w-[300px] max-w-[600px] h-full overflow-y-auto px-10 sm:px-20`}
  background: ${({ theme }) => theme.backgroundNormal};
`;

export const AuthAside = styled.aside`
  ${tw`flex flex-col w-full`}
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

export const Container = styled.div`
  ${tw`flex w-full h-full`}
`;


export const SSO = styled.div`
  ${tw`p-5 mt-7 flex justify-center w-full border-2 rounded-xl cursor-pointer`}
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

