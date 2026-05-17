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
  min-width: 560px;
  max-width: 640px;
  padding: 24px 24px 20px;
  text-align: left;
  font-family: 'Poppins', ui-sans-serif, system-ui, sans-serif;
  color: var(--ink);
  ${mediaQuery.sm} {
    min-width: 100%;
    padding: 18px 18px 16px;
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
  font-weight: 600;
  font-size: 14px;
  line-height: 28px;
  color: var(--ink);
  border-top: 1px solid var(--line);
  padding: 12px 0px;
`;

export const OptionDescription = styled.div`
  width: 100%;
  font-size: 13px;
  line-height: 20px;
  color: var(--ink-3);
  text-align: left;
`;

export const Select = styled.select`
  background-color: var(--canvas);
  margin: 10px 12px;
  min-width: 200px;
  min-height: 38px;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--ink);
  padding: 0 12px;
  font-family: 'Poppins', sans-serif;
  &:focus { border-color: var(--line-2); outline: none; }
`;

export const ColoredSpan = styled.span`
  color: var(--brand-2);
  font-size: 13px;
`;

export const CancelButton = styled(ButtonLarge)`
  background: transparent;
  border: 1px solid var(--line-2);
  color: var(--ink);
  border-radius: 999px;
  padding: 8px 20px;
  font-weight: 600;
  &:hover { background: var(--hover); }
`;
