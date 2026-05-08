// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import { useState } from 'react';
import { ChannelType } from '@prisma/client';
import { LargeIcon } from '@src/styles/Globals';
import { capitalize } from 'lodash';

import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
import Icons from 'icons';
import { Channel } from 'types/prisma';

import ChatIcon from 'public/graphics/channelicons/chat.svg';
import PostIcon from 'public/graphics/channelicons/post.svg';
import LiveIcon from 'public/graphics/commonicons/live.svg';
import TextIcon from 'public/graphics/commonicons/message.svg';
import Verified from 'public/graphics/commonicons/verified.svg';

import { ClickableContainer, Container, Description, TextHighlight, VerificationIcon } from './styled';

//Trade channel type for an SVG icon
const getLargeChannelIcon = (type?: ChannelType, active: boolean = false) => {
  switch (type) {
    case ChannelType.CHAT:
      return <LargeIcon $solid={false} $active={active} as={ChatIcon} />;
    case ChannelType.POST:
      return <LargeIcon $solid={true} $active={active} as={PostIcon} />;
    case ChannelType.DISCUSSION:
      return <LargeIcon $solid={true} $active={active} as={TextIcon} />;
    case ChannelType.LIVESTREAM:
      return <LargeIcon $solid={true} $active={active} as={LiveIcon} />;
    default:
      return <LargeIcon $active={active} as={ChatIcon} />;
  }
};

type Props = {
  channel: Channel;
  
  // Unused?
  onClick?: () => void;
  verified?: boolean;
  image?: string;
};

const Header: React.FC<Props> = ({
  channel,
  image,
  verified,
  onClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const icon = getLargeChannelIcon(channel.type, true);
  const postLevel = channel.writePermission;
  const viewLevel = channel.readPermission;

  return (
    <Container className="flex flex-wrap justify-between  items-center w-full py-[10px] sm:px-10">
      <ClickableContainer onClick={onClick} clickable={onClick ? true : false} >
        {image && <Avatar size={50} type={AvatarTypes.Profile} image={image} circle /> }
        {icon}
        <div>
          <div className="flex items-center" >
            <h3 className="mx-6 min-w-max">{channel.name}</h3>
            {verified && <VerificationIcon $solid={true} $color='primary' as={Verified} />}
          </div>
        </div>
      </ClickableContainer>

      {isExpanded ? (
        <div className="mx-5 cursor-pointer">
          <Icons.Close onClick={() => setIsExpanded(!isExpanded)}/>
        </div>
      ) : (
        <div className="mx-8 cursor-pointer hover:underline" onClick={() => setIsExpanded(!isExpanded)}>Details</div>
      )}

      {isExpanded && (
        <div className="ml-14">
          <div className="flex min-w-max my-4">
            {postLevel === viewLevel && <TextHighlight>{postLevel} Only</TextHighlight>}
            {postLevel !== viewLevel && (
              <>
                <TextHighlight>{capitalize(postLevel)} Can Post</TextHighlight>
                <TextHighlight>{capitalize(viewLevel)} Can View</TextHighlight>
              </>
            )}
          </div>
          <div className="ml-2 mr-4 sm:mx-0">
            <Description>{channel.description}</Description>
          </div>
        </div>
      )}
    </Container>
  );
};
export default Header;
