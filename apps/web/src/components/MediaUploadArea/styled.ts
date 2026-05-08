// Copyright 2021 NewSocial Inc.
// Author(s): Dylan Trafford
// Description: Styling

import ReactPlayer from 'react-player';
import styled, { css } from 'styled-components';

import { OldCol } from 'styles/Flex';
import { Icon } from 'styles/Globals';
import { mediaQuery } from 'styles/Globals';

type Props = {
  show : boolean
};

export const OuterBlock = styled(OldCol)`
  position: relative;
  justify-content: center;
  align-items: center;
  padding: 20px;

  width: fit-content;
  max-width: 70vw;
  height: 100%;

  font-weight: bold;
  font-size: 26px;
  line-height: 32px;
  color: ${({ theme }) => theme.fontFocus};
`;

export const MediaArea = styled(OldCol)<Props>`
  border: 2px dashed ${({ theme }) => theme.backgroundLight};
  border-radius: 20px;
  padding: 80px 10px 90px;
  margin: 30px 0px;
  height: 100%;
  width: 100%;

  align-items: center;

  ${({ show }) => !show && css`
    display: none;
  `}
`;

export const MediaPreview = styled.img<Props>`
  width: 100%;
  height: 100%;
  object-fit: cover;
  margin: auto;
  border-radius: 8px;

  ${({ show }) => !show && css`
    display: none;
  `}
`;

export const MediaPlayer = styled(ReactPlayer)`
  border-radius: 15px;
  width: 100%;
  height: auto;
  max-height: 800px;
  object-fit: cover;
  ${mediaQuery.sm} {
    max-height: 300px;
  }
`;

export const RemoveMediaIcon = styled(Icon)`
  position: absolute;
  top: 15px;
  left: 15px;
  z-index: 1; //On Top of Image
`;

export const MediaUploadIcon = styled(Icon)`
  margin: 10px auto;
  width: 50px;
  height: 50px;
  cursor: pointer;
`;

export const UploadInstructions = styled.span`
  font-weight: bold;
  font-size: 20px;
  line-height: 26px;
  margin: 20px auto;
`;
