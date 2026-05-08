import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {  Descendant } from 'slate';

import UploadInput from 'components/UploadInput';
import Icons from 'icons';

import RichInput from './RichInput';
import { InputContainer } from './styled';
import { ActionsContainer, ButtonContainer, PreviewImage } from './styled';


type ChatProps = {
  onSubmit: (text: string, media: File | undefined) => void;
  allowMedia?: boolean;
  maxHeight?: number;
  placeholderText?: string;
};

const ChatInput = ({ onSubmit, allowMedia, maxHeight, placeholderText }: ChatProps) => {
  const [selectedFile, setSelectedFile] = useState<File>();
  const fileUploadRef = useRef<HTMLInputElement>(null);
  const [, setMessage] = useState<Descendant[]>([]);
    
  const handleSubmit = (value: Descendant []) => {
    if (value.length > 0 || selectedFile) {
      onSubmit(JSON.stringify(value), selectedFile);
      return true;
    } else {
      toast.warn('You cannot send an empty message');
      return false;
    }
  };

  return (
    <InputContainer>
      <ActionsContainer>
        {selectedFile && allowMedia &&
        <PreviewImage
          src={selectedFile ? URL.createObjectURL(selectedFile) : ''}
          onClick={() => setSelectedFile(undefined)}
        />
        }
      </ActionsContainer>
      <ButtonContainer>
        {allowMedia && (
          <Icons.Plus 
            clickable
            margin='8px'
            onClick={() => fileUploadRef?.current?.click()} 
          />
        )}
        <RichInput 
          send
          placeholderText={placeholderText}
          maxHeight={maxHeight}
          onSubmit={(value: Descendant[]) => handleSubmit(value)}
          onChange={(value: Descendant[]) => setMessage(value)}
        />
      </ButtonContainer>
      <UploadInput
        ref={fileUploadRef}
        onChange={files => setSelectedFile(files[0])}
      />
    </InputContainer>
  );
};

export default ChatInput;