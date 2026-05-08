// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Styling

import { MentionsInput } from 'react-mentions';
import styled, { css } from 'styled-components';

import { ButtonLarge } from 'styles/Buttons';
import { OldCol, OldRow } from 'styles/Flex';
import { Icon, mediaQuery } from 'styles/Globals';

type Props = {
  show : boolean
};

export const ConfirmCancelButton = styled.button`
  background-color: ${({ theme }) => theme.primary};

`;

export const CloseContainer = styled.div`
  position: absolute;
  right: 0;
  margin: 5px;
  cursor: pointer;
`;

export const ActionButton = styled.div`
  background-color: ${({ theme }) => theme.backgroundLight};
  border-radius: 20%;
  padding: 10px 4px 0px 10px;
  margin: 0px 4px;
  width: 40px;
  height: 40px;
`;


export const CreatePostContainer = styled.div`
  display: flex;
  ${mediaQuery.sm} {
    display: inline;
  }
`;

export const BackgroundOverlay = styled.div<Props>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  backdrop-filter: blur(10px);
  z-index: 3;
  display: flex;
  justify-content: center;

  ${({ show }) => !show && css`
    display: none;
  `}
`;

export const PostOptions = styled(OldCol)`
  width: 100%;
  height: 100%;
  min-width: 500px;
  padding: 20px;
  text-align: left;
  ${mediaQuery.sm} {
    min-width: 100%;
  }
`;

export const ClosePostIcon = styled(Icon)`
  position: absolute;
  top: 20px;
  right: 20px;
`;

export const DisplayName = styled.span`
  font-weight: bold;
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.fontPrimary};
`;

export const UserName = styled.span`
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.fontTertiary};
`;

export const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin: 0px 16px;
`;

export const InputTitle = styled.input`
  min-height: 47px;
  width: 100%;

  margin-top: 20px;

  background-color: transparent;
  border: none;

  color: ${({ theme }) => theme.fontSecondary};
  font-weight: bold;
  font-size: 26px;
  line-height: 32px;
  &:focus {
    color: ${({ theme }) => theme.fontFocus};
  }
`;

export const InputText = styled(MentionsInput)`
  min-height: 150px;
  width: 100%;
  background-color: transparent;
  border: none;

  color: ${({ theme }) => theme.fontSecondary};
  font-size: 16px;
  line-height: 24px;
  &:focus {
    color: ${({ theme }) => theme.fontFocus};
  }
`;

export const Option = styled(OldRow)`
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
  line-height: 34px;
  color: ${({ theme }) => theme.fontFocus};
  border-top: 1px dotted ${({ theme }) => theme.backgroundLight};
  padding: 10px 0px;
`;

export const OptionDescription = styled.div`
  width: 100%;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.fontTertiary};
  text-align: left;
`;

export const Select = styled.select`
  background-color: transparent;
  margin: 10px 20px;
  min-width: 200px;
  min-height: 34px;
  border: 1px solid ${({ theme }) => theme.backgroundLight};
  border-radius: 8px;
  color: ${({ theme }) => theme.primary};
`;

export const ColoredSpan = styled.span`
  color: ${({ theme }) => theme.primary};
`;

export const CancelButton = styled(ButtonLarge)`
  background: none;
  border: 3px solid ${({ theme }) => theme.primary};
`;
