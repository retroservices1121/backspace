// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useRef } from 'react';
import { useField } from 'formik';
import { ErrorMessage as FormikErrorMessage, ErrorMessageProps } from 'formik';
import { StyledComponentProps } from 'styled-components';
import { v4 } from 'uuid';

import { AsInput } from 'types/forms';

import { FieldError, Input, RadioBtnInput, RadioBtnLabel, Textarea } from './styles';


export type RestyledInput<T extends string = 'input'> = StyledComponentProps<T, any, {}, never> & {
  label: string;
};

const MakeInput = <T extends string>(Component: React.FC<any> ): React.FC<RestyledInput<T>> => ({
  name, label, ...props
}) => {
  const [{}, {}, { setValue }] = useField(name);
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <Component
        {...props}
        id={name}
        name={name}
        onBlur={(e: any) => setValue(e.target.value.trim())}
      />
    </div>
  );
};


export const FormInput = MakeInput<'input'>(Input);
export default FormInput;

export const FormTextarea = MakeInput<'textarea'>(Textarea);

/** HTML input[type="radio"] requires the value prop, different from formik field value */
export const RadioInput: AsInput<string> = ({
  children, ...fieldProps
}) => {
  const id = useRef(v4());
  // The fieldProps.value is not the "formik.values[name]" value.
  // fieldProps.value is the checkbox.value
  const [{ value }] = useField(fieldProps.name);

  return (
    <span style={{ padding: '0 .5em' }}>
      <RadioBtnInput
        {...fieldProps}
        defaultChecked={value === fieldProps.value}
        type="radio"
        id={id.current}
      />
      <RadioBtnLabel htmlFor={id.current}>{children}</RadioBtnLabel>
    </span>
  );
};

export const ErrorMessage = (props: ErrorMessageProps) => {
  return (
    <FormikErrorMessage
      {...props}
      render={msg => {
        const renderer = props.children || props.render;
        if (renderer) {
          return (
            <FieldError>{renderer(msg)}</FieldError>
          );
        }
        return (
          <FieldError>{msg}</FieldError>
        );
      }}
    />
  );
};