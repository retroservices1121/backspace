// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: User Select Media and Upload

import React, { useRef } from 'react';
import { useState } from 'react';

import { Button, ButtonLarge, LargeTextButton } from 'styles/Buttons';
import { Col } from 'styles/Flex';

//Icons
import CloseIcon from '../../../public/graphics/commonicons/close.svg';
import UploadIcon from '../../../public/graphics/commonicons/upload.svg';
import { MediaPlayer, MediaPreview, MediaUploadIcon, RemoveMediaIcon, UploadInstructions } from './styled';


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
      <div className='md:w-media md:max-h-media'>
        {previewMedia && 
          <RemoveMediaIcon 
            $color='fontFocus' 
            $solid $clickable 
            onClick={removeMedia}
          ><CloseIcon /></RemoveMediaIcon>
        }
        {mediaType !== 'video' 
          ? <MediaPreview show={previewMedia ? true : false} src={previewMedia} alt="Media Error" />
          : <MediaPlayer width="100%" url={previewMedia} controls loop />
        }
        {!previewMedia &&
          <Col className='justify-center align-center text-center w-full h-full m-auto'>
            <MediaUploadIcon 
              onClick={() => inputRef.current && inputRef.current.click()} 
              $color="primary"><UploadIcon/>
            </MediaUploadIcon>
            <UploadInstructions>Select photo or video to upload</UploadInstructions>
            <ButtonLarge
              className='m-auto'
              color="primary" onClick={() => inputRef.current && inputRef.current.click()}>Select Media to Upload
            </ButtonLarge>
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
      </div>
    </div>
  );
};

export default MediaUploadArea;
