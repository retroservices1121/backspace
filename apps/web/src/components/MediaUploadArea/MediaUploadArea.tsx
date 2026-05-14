// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Compact, X-style media attach control for the composer.
// A small icon button opens the file picker; once a file is chosen it
// renders an inline preview with a remove control.

import React, { useRef, useState } from 'react';

//Icons
import CloseIcon from '../../../public/graphics/commonicons/close.svg';
import UploadIcon from '../../../public/graphics/commonicons/upload.svg';
import {
  AttachButton,
  MediaPlayer,
  MediaPreview,
  PreviewWrapper,
  RemoveMediaIcon,
} from './styled';

type Props = {
  setMedia: (media: File | undefined) => void;
};

const MediaUploadArea: React.FC<Props> = ({ setMedia }) => {
  const [previewMedia, setPreviewMedia] = useState('');
  const [mediaType, setMediaType] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addMedia = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0];
    if (!file) return;
    setPreviewMedia(URL.createObjectURL(file));
    setMediaType(file.type.includes('video') ? 'video' : 'image');
    event.target.value = ''; // allow re-selecting the same file later
    setMedia(file);
  };

  const removeMedia = () => {
    setMedia(undefined);
    setPreviewMedia('');
    setMediaType('');
  };

  return (
    <div>
      <AttachButton
        type="button"
        title="Add photo or video"
        onClick={() => inputRef.current?.click()}
      >
        <UploadIcon />
      </AttachButton>
      <input
        type="file"
        id="new-post-media-upload"
        ref={inputRef}
        name="file-upload"
        accept="image/png, image/jpeg, image/gif, video/mp4, video/x-m4v, video/*"
        style={{ display: 'none' }}
        onChange={addMedia}
      />
      {previewMedia && (
        <PreviewWrapper>
          <RemoveMediaIcon
            $color="fontFocus"
            $solid
            $clickable
            onClick={removeMedia}
          >
            <CloseIcon />
          </RemoveMediaIcon>
          {mediaType === 'video' ? (
            <MediaPlayer width="100%" url={previewMedia} controls loop />
          ) : (
            <MediaPreview show src={previewMedia} alt="Selected media" />
          )}
        </PreviewWrapper>
      )}
    </div>
  );
};

export default MediaUploadArea;
