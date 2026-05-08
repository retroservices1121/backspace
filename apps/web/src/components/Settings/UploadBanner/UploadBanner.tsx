// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect, useRef, useState } from 'react';

import { getMediaUrl } from 'api/mediaAPI';
import UploadInput from 'components/UploadInput';
import { EditButton } from 'styles/Buttons';
import { Icon } from 'styles/Globals';
import { Space } from 'styles/layout';
import { Input } from 'types/forms';

import EditIcon from '../../../../public/graphics/commonicons/edit.svg';
import { Container, EditButtonWrapper } from './styles';

type Props = {
  preview: string | null;
};


// Refactor
const UploadBanner: Input<File, Props> = ({
  field: { name, value },
  form: { setFieldValue },
  preview,
}) => {
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const [mediaURL, setMediaURL] = useState('');

  useEffect(() => {
    if (value) {
      setMediaURL(URL.createObjectURL(value));
    } else if (preview) {
      getMediaUrl(preview).then((url) => {
        setMediaURL(url);
      });
      
    }
  }, [preview, value]);

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
