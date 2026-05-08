// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled, { css } from 'styled-components';

import { ClickableSpan, LargeTextButton } from 'styles/Buttons';
import { OldCol, OldRow } from 'styles/Flex';
import { mediaQuery } from 'styles/Globals';

type Props = {
  active: boolean;
};

export const AppearanceContainer = styled.div`
  display: flex;
  ${mediaQuery.sm} {
    display: inline;
  }
`;

export const ThemeButton = styled(LargeTextButton)`
  border: 1px solid ${({ selected, theme }) => selected ? theme.primary : theme.none};
`;

export const CheckContainer = styled.div<Props>`
  background-color: ${({ theme }) => theme.primary};
  height: 24px;
  width: 24px;
  svg {
    height: 18px;
    width: 18px;
  }
`;

/** SETTINGS */
export const OptionHeader = styled(OldRow)`
  justify-content: flex-start;
  margin: 5px 0px;
  color: inherit;
`;

export const OptionBlock = styled.div<Props>`
  cursor: pointer;
  text-align: left;
  margin: 10px auto;
  width: 80%;
  padding: 18px 20px;
  border-radius: 10px;
  color: ${({ theme }) => theme.fontFocus};
  border: 1px solid transparent;

  h4{
    margin: 0px 10px;
  }

  &:hover {
    border: 1px solid ${({ theme }) => theme.secondary};
  }

  ${({ active, theme }) => active && css`
    background: ${theme.primary};
    * {
      color: ${theme.white}
    }    
    ${OptionHeader} {
      fill: ${theme.white};
      stroke: ${theme.white};
    }
  `}
`;

/** BILLING */
export const PaymentContainer = styled(OldCol)`
  width: 300px;
  height: 129px;
  border: 1px solid ${({ theme }) => theme.backgroundLight};
  border-radius: 10px;
  padding: 20px;
  margin: 10px 20px;
`;

export const AddPaymentContainer = styled(PaymentContainer)`
  cursor: pointer;
  justify-content: center;
  align-items: center;
  text-align: center;
  border: 2px dashed ${({ theme }) => theme.primary};
  color: ${({ theme }) => theme.primary};
  font-weight: bold;
  font-size: 14px;
  line-height: 20px;

  &:hover {
    background-color: ${({ theme }) => theme.backgroundNormal};
    font-size: 1.1em;
  }
`;

export const ProviderLogo = styled.img`
  width: 42px;
  height: 42px;
`;

export const PaymentTitle = styled.span`
  font-weight: bold;
  font-size: 16px;
  line-height: 20px;
`;

export const PaymentDescription = styled.span`
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.fontTertiary};
`;

export const PaymentActions = styled(OldRow)`
  align-items: center;
  height: 100%;
  width: 100%;
`;

export const DefaultText = styled(ClickableSpan)`
  color: ${({ theme }) => theme.tertiary};
  font-weight: bold;
  font-size: 14px;
  line-height: 20px;
  margin: 0px 10px;
`;

export const RemoveText = styled(ClickableSpan)`
  color: red;
  font-weight: bold;
  font-size: 14px;
  line-height: 20px;
  margin: 0px 10px;
`;



