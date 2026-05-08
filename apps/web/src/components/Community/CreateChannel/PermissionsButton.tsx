// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import { Permissions } from '@prisma/client';
import { NewChannelFields } from '@src/types/channel';
import { EnumType } from 'typescript';

import { Input } from 'types/forms';

import { AccessOption } from './styled';

type OnClick<E = HTMLDivElement> = React.MouseEvent<E, MouseEvent>;

type PermissionsButtonProps = {
  enumType: EnumType;
};

const PermissionsArray = [];
for (const each in Permissions) {
  PermissionsArray.push(each);
}

const PermissionTranslate = {
  [NewChannelFields.Read]: 'View',
  [NewChannelFields.Write]: 'Post',
};


const PermissionsButton: Input<typeof PermissionsArray, PermissionsButtonProps> = ({
  field: { name, value },
  form: { setFieldValue },
  enumType = Permissions,
}) => {
  const permissions = PermissionsArray.length; 

  const handleUpdate = (index: number) => (event: OnClick) => {
    event.stopPropagation();
    setFieldValue(name, index);
  };

  let accumulator = null;

  //Take an index and compare it to current value
  const isSelected = (index: number, current: Permissions) => {
    const indexCurrent = PermissionsArray.findIndex((val) => val == current);
    return index >= indexCurrent;
  };

  // Recursion Inferior. Iterative Superior.
  for (let index = permissions - 1; index >= 1; index--) { //end at 1 to remove blocked
    accumulator = (
      <AccessOption 
        selected={isSelected(index, value as unknown as Permissions)} 
        onClick={handleUpdate(PermissionsArray[index])} >
        {accumulator}
        {PermissionsArray[index]}
      </AccessOption>
    );
  }

  return (
    <div className='w-1/2'>
      <h4>{value} and up can {PermissionTranslate[name]}</h4>
      <br />
      {accumulator}
    </div>
  );
};

export default PermissionsButton;
