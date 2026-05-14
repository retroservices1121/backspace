// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect, useMemo, useRef } from 'react';

import UploadInput from 'components/UploadInput';
import { EditButton } from 'styles/Buttons';
import { Icon } from 'styles/Globals';
import { Space } from 'styles/layout';
import { Input } from 'types/forms';

import EditIcon from '../../../../public/graphics/commonicons/edit.svg';
import { Container, EditButtonWrapper } from './styles';

type Props = {
  // Already-resolved image URL for the user's current banner (callers
  // resolve the Media row via useMedia before passing it in).
  preview: string | null;
};


// Refactor
const UploadBanner: Input<File, Props> = ({
  field: { name, value },
  form: { setFieldValue },
  preview,
}) => {
  const fileUploadRef = useRef<HTMLInputElement>(null);

  // Blob URL for the just-picked file. Memoized + revoked so we don't
  // mint (and leak) a fresh object URL on every render.
  const objectUrl = useMemo(
    () => (value ? URL.createObjectURL(value) : ''),
    [value],
  );
  useEffect(() => () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  const mediaURL = objectUrl || preview || '';

  return (
    <Container showBorder={mediaURL ? false : true}>
      {mediaURL && <img style={{ objectFit: 'cover' }} src={mediaURL} alt='banner' />}
      <EditButtonWrapper>
        <EditButton onClick={() => fileUploadRef.current?.click()}>
          <Icon $solid as={EditIcon} />
          <Space size='sm'/>
          Edit Cover
          <UploadInput
            ref={fileUploadRef}
            onChange={files => setFieldValue(name, files[0])}
          />
        </EditButton>
      </EditButtonWrapper>
    </Container>
  );
};

export default UploadBanner;
