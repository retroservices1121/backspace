// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Icons from 'icons';

import { legacyFirebasePathToURL } from '@src/api2/storage';
import UploadInput from 'components/UploadInput';
import { Flex } from 'styles/Flex';
import { Icon } from 'styles/Globals';
import { Input } from 'types/forms';

import CameraIcon from '../../../../public/graphics/commonicons/camera.svg';
import { Container, PlusButton } from './styles';

type Props = {
  preview: string | null;
};


// Refactor
const UploadPfp: Input<File, Props> = ({
  field: { name, value },
  form: { setFieldValue },
  preview,
}) => { 
  const fileUploadRef = useRef<HTMLInputElement>(null);

  //Show current profile image if available. Resolve in an effect —
  //doing it in the render body kicked off an async setState on every
  //render, which loops and freezes the page.
  const [previewURL, setPreviewURL] = useState('');
  useEffect(() => {
    if (preview) legacyFirebasePathToURL(preview).then(setPreviewURL);
  }, [preview]);

  // Blob URL for the just-picked file. Memoized + revoked so we don't
  // mint (and leak) a fresh object URL on every render.
  const objectUrl = useMemo(
    () => (value ? URL.createObjectURL(value) : ''),
    [value],
  );
  useEffect(() => () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  return (
    <Container $direction="column" $center>
      {objectUrl || previewURL ? (
        <img src={objectUrl || previewURL} />
      ) : (
        <Flex $direction="column" $center>
          <Icon $solid as={CameraIcon}/>
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
