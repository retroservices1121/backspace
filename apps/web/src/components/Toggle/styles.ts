// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import styled, { css } from 'styled-components';

export const Slider = styled.span<{ round?: boolean }>`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.backgroundLight};
  border: 1px ridge ${({ theme }) => theme.backgroundMedium};
  -webkit-transition: .4s;
  transition: .4s;

  &:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 4px;
    background-color: ${({ theme }) => theme.white};
    border: 1px outset ${({ theme }) => theme.primary};
    -webkit-transition: .4s;
    transition: .4s;
  }

  ${({ round }) => round && css`
    /* Rounded sliders */
    & {
      border-radius: 28px;
    }

    &:before {
      border-radius: 50%;
    }
  `}
`;

export const Container = styled.label`
  /* The switch - the box around the slider */
  position: relative;
  display: inline-block;
  width: 56px;
  height: 28px;
  /* Hide default HTML checkbox */
  & input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  input:checked + ${Slider} {
    background-color: rgba(${({ theme }) => theme.primary_rgb}, 0.7);
  }

  input:focus + ${Slider} {
    box-shadow: 0 0 1px ${({ theme }) => theme.primary};
  }

  input:checked + ${Slider}:before {
    -webkit-transform: translateX(26px);
    -ms-transform: translateX(26px);
    transform: translateX(26px);
  }
`;

