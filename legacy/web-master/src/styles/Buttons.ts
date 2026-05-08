// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled, { css, DefaultTheme } from 'styled-components';

export type Props = {
  color?: keyof DefaultTheme;
  selected?: boolean;
  selectedColor?: keyof DefaultTheme;
  textColor?: keyof DefaultTheme;
};

export const ButtonCss = css<Props>`
  width: fit-content;
  height: fit-content;

  display: flex;
  justify-content: center;
  align-items: center;

  color: ${({ theme, textColor }) => (textColor && theme[textColor]) || theme.fontFocus};
  font-weight: bold;
  font-size: 16px;
  line-height: 40px;
  cursor: pointer;

  border-radius: 8px;
  background: ${({ color, theme }) => color && theme[color] || theme.primary};

  /* If button is primary, keep text white */
  ${({ color, theme }) => (color === 'primary' || color === 'primary_rgb') && css`
    color: ${theme.white};
  `}

  /* If selected */
  ${({ selected, selectedColor, theme }) => selected && selectedColor && css`
    background: ${theme[selectedColor]};
    color: ${theme.fontFocus};
  `}

  border: 1px solid ${({ theme }) => theme.backgroundLight};
  &:hover:not(::disabled) {
    filter: brightness(1.1);
    border: 1px solid ${({ theme }) => theme.primary};;
  }
`;

/** Use this if you want something to _look like a button_ */
export const textButtonCss = css`
  ${ButtonCss}
  padding: 10px 20px;
  font-size: 12px;
  line-height: 18px;
  border-radius: 8px;
`;


/** Medium sized button */
export const Button = styled.button.attrs(props => ({
  // to prevent all button from accidentally being a form submit
  type: props.type || 'button',
}))<Props>`
  ${ButtonCss}

  padding: 10px 20px;
  font-size: 12px;
  line-height: 18px;
  border-radius: 8px;

  ${({ theme, disabled }) => disabled && css`
    background-color: ${theme.backgroundLight};
    color: ${theme.fontTertiary};
  `}
`;

// Only change whats different from Button
export const ButtonLarge = styled(Button)`
  padding: 12px 30px;
  font-size: 16px;
  line-height: 24px;
  border: 1px solid ${({ theme, color }) => color === 'none' ? theme.primary : 'none'};

  &:hover {
    border: 1px solid ${({ theme }) => theme.primary};
  }
`;

// Only change whats different from Button
export const ButtonSmall = styled(Button)`
  /* These are placeholders */
  padding: 5px 10px;
  line-height: 16px;
`;

export const WideButton = styled(Button)`
  /* These are placeholders */
  width: 100%;
  border: none;
  font-size: 14px;
  padding: 1.5rem 3rem;
  line-height: 16px;
`;

// These aliases were made to deprecate the buttons without breaking shit or changing a million files.
/** @deprecated Use Button instead */
export const MediumTextButton = Button;
/** @deprecated Use ButtonLarge instead */
export const LargeTextButton = ButtonLarge;
/** @deprecated Use ButtonSmall instead */
export const SmallTextButton = ButtonSmall;


export const IconButton = styled.button.attrs((props) => ({
  // to prevent all button from accidentally being a form submit
  type: props.type || 'button',
  color: props.color || props.theme.backgroundLight,
}))
`
  ${ButtonCss}
  margin: 0px 5px;
  width: 48px;
  height: 48px;
  border: 1px solid transparent;
  &:hover {
    border-color: ${({ theme }) => theme.primary};
  }
`;


export const ClickableSpan = styled.span`
  cursor: pointer;
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.fontPrimary};
  &:hover {
    filter: brightness(1.1);
    color: ${({ theme }) => theme.primary};
  }
`;

export const EditButton = styled(ButtonSmall).attrs({
  color: 'backgroundDark',
})
`
  display: inline-flex;
`;
