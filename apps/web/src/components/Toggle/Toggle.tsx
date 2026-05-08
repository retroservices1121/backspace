// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Input } from 'types/forms';

import { Container, Slider } from './styles';

type Props = {
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  checked?: boolean;
  name?: string;
};

const Toggle: React.FC<Props> = ({
  checked = false,
  onChange,
  name = 'Toggle',
}) => (
  <Container>
    <input
      name={name}
      type="checkbox"
      checked={checked}
      onChange={onChange}
    />
    <Slider round/>
  </Container>
);

export default Toggle;

export const FormToggle: Input<boolean, Props> = ({
  field: { name, value, onChange },
}) => (
  <Toggle
    name={name}
    checked={value}
    onChange={onChange}
  />
);