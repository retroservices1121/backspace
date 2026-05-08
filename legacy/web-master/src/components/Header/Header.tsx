// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import { useState } from 'react';
import Icons from 'icons';

import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
import { ReactComponent as Verified } from 'graphics/commonicons/verified.svg';

import { ClickableContainer, Container, Description, TextHighlight, VerificationIcon } from './styled';

type Props = {
  title?: string;
  postLevel?: string;
  viewLevel?: string;
  image?: string;
  verified?: boolean;
  icon?: JSX.Element;
  description?: string;
  onClick?: () => void;
};

const Header: React.FC<Props> = ({
  title = '',
  description = '',
  postLevel,
  viewLevel,
  image,
  icon,
  verified,
  onClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Container>
      <ClickableContainer onClick={onClick} clickable={onClick ? true : false} >
        {image && <Avatar size={50} type={AvatarTypes.Profile} image={image} circle /> }
        {icon && icon}
        <div>
          <div className="flex items-center" >
            <h3 className="mx-6 min-w-max">{title}</h3>
            {verified && <VerificationIcon $solid={true} $color='primary' as={Verified} />}
          </div>
        </div>
      </ClickableContainer>

      {isExpanded ? (
        <div className="mx-5 cursor-pointer">
          <Icons.Close onClick={() => setIsExpanded(!isExpanded)}/>
        </div>
      ) : (
        <div className="mx-8 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>Details</div>
      )}

      {isExpanded && (
        <div className="ml-14">
          <div className="flex min-w-max my-4">
            {postLevel && viewLevel && postLevel === viewLevel && <TextHighlight>{postLevel} Only</TextHighlight>}
            {postLevel && postLevel !== viewLevel && <TextHighlight>{postLevel} Can Post</TextHighlight>}
            {viewLevel && postLevel !== viewLevel && <TextHighlight>{viewLevel} Can View</TextHighlight>}
          </div>
          <div className="ml-2 mr-4 sm:mx-0">
            <Description>{description}</Description>
          </div>
        </div>
      )}
    </Container>
  );
};
export default Header;
