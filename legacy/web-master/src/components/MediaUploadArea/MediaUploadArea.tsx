// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: User Select Media and Upload

import React, { useRef } from 'react';
import { useState } from 'react';

import { MediaContainer } from 'components/MediaPost/styled';
import { ReactComponent as CloseIcon } from 'graphics/commonicons/close.svg';
//Icons
import { ReactComponent as UploadIcon } from 'graphics/commonicons/upload.svg';
import { LargeTextButton } from 'styles/Buttons';
import { Col } from 'styles/Flex';

import { MediaPlayer, MediaPreview, MediaUploadIcon, Overlay, RemoveMediaIcon, UploadInstructions } from './styled';


type Props = {
  setMedia: (media : File | undefined) => void;
};

const MediaUploadArea:React.FC<Props> = ({ setMedia }) => {

  const [previewMedia, setPreviewMedia] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [mediaType, setMediaType] = useState('');

  const addMedia = (event : React.ChangeEvent<HTMLInputElement>) => {
    let newMedia = undefined; //Default in case no files
    if (event?.target?.files) {
      newMedia = event.target.files[0];
      let url = URL.createObjectURL(newMedia);
      setPreviewMedia(url);
      event.target.value = ''; // Clear event target so we can get a new file
    } else {
      setPreviewMedia('');
    }
    if (newMedia) {
      if (newMedia.type.includes('video')) setMediaType('video');
      if (newMedia.type.includes('image')) setMediaType('image');
    }
    setMedia(newMedia);
  };

  //eslint-disable-next-line
  const removeMedia = () => {
    setMedia(undefined);
    setPreviewMedia('');
    setMediaType('');
  };

  return (
    <div>
      <h2 className="text-center mt-12 sm:mt-24"> Create New Post </h2>
      {/* Media Container is from Media post so we only have to maintain the ratio in one place */}
      <MediaContainer>
      {previewMedia && <RemoveMediaIcon $color='fontFocus' $solid $clickable onClick={removeMedia}><CloseIcon /></RemoveMediaIcon>}
          <MediaContainer>
            <Overlay />
            {mediaType !== 'video' && <MediaPreview show={previewMedia ? true : false} src={previewMedia} alt="Media Error" />}
            {mediaType === 'video' && <MediaPlayer width="100%" url={previewMedia} controls loop />}
          </MediaContainer>
        {!previewMedia &&
          <Col $full $center>
            <MediaUploadIcon onClick={() => inputRef.current && inputRef.current.click()} $color="primary"><UploadIcon/></MediaUploadIcon>
            <UploadInstructions>Select photo or video to upload</UploadInstructions>
            <LargeTextButton
              color="primary" onClick={() => inputRef.current && inputRef.current.click()}>Select Media to Upload
            </LargeTextButton>
            <input
              type="file"
              id="new-post-media-upload"
              ref={inputRef}
              name="file-upload"
              accept="image/png, image/jpeg, image/gif, video/mp4, video/x-m4v, video/*"
              style={{ display: 'none' }}
              onChange={addMedia}
            />
          </Col>
        }
      </MediaContainer>
    </div>
  );
};

export default MediaUploadArea;
