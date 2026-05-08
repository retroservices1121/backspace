// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';

type Props = {
  onChange: (files: File[]) => void;
};

const UploadInput = React.forwardRef<HTMLInputElement, Props>(({
  onChange,
}, ref) => {
  const handleChange = (event : React.ChangeEvent<HTMLInputElement>) => {
    if (event?.target?.files) {
      // @ts-ignore FIXME: I don't understand this error
      let files = [...event?.target?.files];

      // console.log('files: ', files[0].size);
      // let url = URL.createObjectURL(newMedia);
      // setPreviewMedia(url);
      onChange(files);
      // Clear event target so we can get a new file
      // event.target.value = '';
    }
  };

  return (
    <input
      ref={ref}
      type="file"
      accept="image/png, image/jpeg, image/gif"
      style={{ display: 'none' }}
      onChange={handleChange}
    />
  );
});

export default UploadInput;
