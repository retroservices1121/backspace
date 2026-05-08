// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';

import placeholderImage from 'graphics/placeholders/1.png';
import { OnlinePresence } from 'shared/types/documents';

import { AvatarImg, Container, OnlineIndicator } from './styled';

export enum AvatarTypes {
  User = 'user',
  Profile = 'profile',
  Community = 'community',
}

type Props = {
  /** No online indicator on community */
  type: AvatarTypes;
  /** Used for both width and height */
  size: number;
  /** circle shape */
  circle?: boolean;
  /** if online then true */
  online?: OnlinePresence;
  /** For if no image */
  title?: string;
  /** Image URL */
  image?: string;
  /** Pass through CSS styling for container */
  style?: React.CSSProperties;
};

const Avatar: React.FC<Props> = ({ type, size, circle, online, image, style }) => {
  const isUser = type === AvatarTypes.User;
  return (
    <Container style={style} circle={circle} size={size}>
      <AvatarImg src={image || placeholderImage} />
      {isUser && <OnlineIndicator online={online || OnlinePresence.Offline} />}
    </Container>
  );
};
export default Avatar;
