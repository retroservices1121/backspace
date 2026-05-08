import React, { useState } from 'react';
import styled from 'styled-components';

import { Input } from 'styles/form';
import { Input as InputType } from 'types/forms';

import EyeOn from '../../../public/graphics/commonicons/eye.svg';
import EyeOff from '../../../public/graphics/commonicons/eyeoff.svg';

//TODO Replace with makeIcon
const StyledEye = styled.svg`
  width: 20px;
  stroke: ${({ theme }) => theme.iconColor};
  opacity: 0.5;
  &:hover {
    cursor: pointer;
    opacity: 1.0;
    stroke: ${({ theme }) => theme.primary};
  }
`;

type Props = {
  label?: string
};

export const PasswordInput: InputType<string, Props> = ({
  field,
  label = 'Password*',
}) => {
  const [showPassword, toggleShowPassword] = useState(false);
  return (
    <div>
      <label htmlFor={field.name}>{label}</label>
    <div className="relative">
      <Input
        {...field}
        type={showPassword ? 'text' : 'password'}
        id={field.name}
        name={field.name}
        placeholder="Password"
      />
      <div className="absolute right-4 bottom-16">
      <StyledEye as={showPassword ? EyeOff : EyeOn} onClick={() => toggleShowPassword(state => !state)} />
      </div>
    </div>
    </div>
  );
};
