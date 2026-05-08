// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { EnumType } from 'typescript';

import { PermissionsType } from 'shared/types/documents';
import { Input } from 'types/forms';

import { AccessOption } from './styled';

type OnClick<E = HTMLDivElement> = React.MouseEvent<E, MouseEvent>;

type PermissionsButtonProps = {
  enumType: EnumType;
};

const PermissionsButton: Input<PermissionsType, PermissionsButtonProps> = ({
  field: { name, value },
  form: { setFieldValue },
  enumType = PermissionsType,
}) => {
  const permissions = Object.keys(enumType).length / 2;

  const handleUpdate = (index: number) => (event: OnClick) => {
    event.stopPropagation();
    setFieldValue(name, index);
  };

  let accumulator = null;

  // Recursion Inferior. Iterative Superior.
  for (let index = permissions - 1; index >= 0; index--) {
    accumulator = (
      <AccessOption selected={index >= value} onClick={handleUpdate(index)}>
        {accumulator}
        {PermissionsType[index]}
      </AccessOption>
    );
  }

  return (
    <>
      <h4>{PermissionsType[value]} and up can {name.toLowerCase()}</h4>
      <br />
      {accumulator}
    </>
  );
};

export default PermissionsButton;
