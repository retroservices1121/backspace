// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect, useRef, useState } from 'react';
import Icons from 'icons';

import MediaAPI from 'api/mediaAPI';
import UploadInput from 'components/UploadInput';
import { ReactComponent as CameraIcon } from 'graphics/commonicons/camera.svg';
import { Flex } from 'styles/Flex';
import { Icon } from 'styles/Globals';
import { Input } from 'types/forms';

import { Container, PlusButton } from './styles';

type Props = {
  preview: string | null;
};


// Refactor
const UploadPfp: Input<File, Props> = ({
  field: { name, value },
  form: { setFieldValue },
  preview = '',
}) => {
  const fileUploadRef = useRef<HTMLInputElement>(null);

  //Show current profile image if available
  const [previewURL, setPreviewURL] = useState('');
  if (preview) MediaAPI.getDownloadURL(preview).then((str) => setPreviewURL(str));

  useEffect(() => {
    if (preview) MediaAPI.getDownloadURL(preview).then((str) => {
      setPreviewURL(str);
    });
  }, [preview]);

  return (
    <Container $direction="column" $center>
      {value || previewURL ? (
        <img src={value ? URL.createObjectURL(value) : previewURL} />
      ) : (
        <Flex $direction="column" $center>
          <Icon $solid as={CameraIcon} />
          {'Upload'}
        </Flex>
      )}
       <PlusButton onClick={() => fileUploadRef?.current?.click()}>
          <Icons.Plus />
          <UploadInput
            ref={fileUploadRef}
            onChange={files => setFieldValue(name, files[0])}
          />
        </PlusButton>
    </Container>
  );
};

export default UploadPfp;