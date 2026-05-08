// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Mention } from 'react-mentions';
import styled, { css } from 'styled-components';

import { textButtonCss } from 'styles/Buttons';

export const placeholderStyle = css`
  color: ${({ theme }) => theme.fontTertiary};
`;

export const BaseInputCss = css`
  padding: 18px 24px;

  width: 100%;
  height: 60px;
  font-size: 16px;
  line-height: 24px;

  background: ${({ theme }) => theme.backgroundLight};
  border-radius: 8px;
  margin: 20px auto;

  border: 1px solid transparent;
  color: ${({ theme }) => theme.fontPrimary};

  ::placeholder {
    ${placeholderStyle}
  }

  &:focus {
    border: 1px solid ${({ theme }) => theme.primary};
  }
`;

export const Input = styled.input`
  ${BaseInputCss}
`;

type TextareaProps = {
  /** css height value string */
  height: string;
};

export const Textarea = styled.textarea<TextareaProps>`
  ${BaseInputCss}
  width: 100%;
  ${({ height }) => height && css`
    height: ${height};
  `}
`;


export const MentionMatch = styled(Mention)`
  ${({ theme }) => css`
    /* background-color: rgba(${theme.primary_rgb}, 0.2); */
    text-decoration: underline;
  `}
`;

// TODO Make custom Checkbox input see https://dev.to/proticm/styling-html-checkboxes-is-super-easy-302o for reference
export const Checkbox = styled.input`
  cursor: pointer;
  background-color: ${({ theme }) => theme.backgroundLight};
  border-radius: 2px;
  // TODO Once we remove the sass file, this important shouldn't be needed anymore
  margin: 0px 10px !important;
  width: 20px;
  height: 20px;
`;

export const FieldError = styled.div`
  font-size: 12px;
  line-height: 18px;
  color: red;
  margin: -5px auto 10px auto;
`;

export const RadioBtnLabel = styled.label.attrs(() => ({
  color: 'none',
}))
`
  ${textButtonCss}
  border: 1px solid ${({ theme }) => theme.backgroundLight};
`;

export const RadioBtnInput = styled.input`
  display: none;
  &:checked + ${RadioBtnLabel} {
    border: 1px solid ${({ theme }) => theme.primary};
  }
`;