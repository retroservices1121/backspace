// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { useRef, useState } from 'react';

import { RestyledInput } from 'components/FormInput';

import { InputDiv, PlaceholderSpan, StylelessInput } from './styles';

export const UsernameInput: React.FC<RestyledInput> = ({
  name, label, ...props
}) => {
  const [showBorder, setShowBorder] = useState(true);
  const fakeInput = useRef<HTMLInputElement>(null);
  return (
    <div className="w-full sm:w-1/2 sm:ml-12">
      <label htmlFor={name}>{label}</label>
      <InputDiv showBorder={showBorder} ref={fakeInput}>
        <PlaceholderSpan>
          {'@'}
        </PlaceholderSpan>
        <StylelessInput
          {...props}
          id={name}
          name={name}
          onFocus={() => setShowBorder(true)}
          onBlur={() => setShowBorder(false)}
        />
      </InputDiv>
    </div>
  );
};

export default UsernameInput;
