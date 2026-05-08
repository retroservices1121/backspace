// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React, { useEffect } from 'react';
import { useState } from 'react';
import { messageActions } from '@src/store/messageSlice';
import { RootState, useAppDispatch } from '@src/store/store';
import { ClickableSpan } from '@src/styles/Buttons';
import { OldRow } from '@src/styles/Flex';
import { Space } from '@src/styles/layout';

import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
import Icons from 'icons';
import { useAppSelector } from 'store/store';

import Verified from '../../../public/graphics/commonicons/verified.svg';
import Search from '../Search';
import UserSearch from '../Search/UserSearch';
import { ClickableContainer, Container, Description, VerificationIcon } from './styled';
type Props = {
  title?: string;
  image?: string;
  verified?: boolean;
  icon?: JSX.Element;
  description?: string;
  showDescription?: boolean; //show description on render
  onClick?: () => void;
};

// TODO this component seems to be a fork of Header and is very very similar.
// Not sure why it was copy pasted, lets make this a hard fork and keep it separate.
// Lets maybe share some common elements between them but lets keep them separate.


const DMHeader: React.FC<Props> = ({
  title = '',
  description = '',
  image,
  icon,
  verified,
  showDescription = false,
  onClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(showDescription);
  const dispatch = useAppDispatch();
  const { id } = useAppSelector((state: RootState) => state.user);

  useEffect(() => {
    if (showDescription) {
      setIsExpanded(showDescription);
    }
  }, [showDescription]);
  return (
    <Container className="flex flex-wrap justify-between  items-center w-full py-[10px] sm:px-10">
      <ClickableContainer onClick={onClick} clickable={onClick ? true : false} >
        {image && <Avatar size={50} type={AvatarTypes.Profile} image={image} circle /> }
        {icon && icon}
        <div>
          <div className="flex items-center" >
            <h3 className="mx-6 min-w-max">{title} </h3>
            {verified && <VerificationIcon $solid={true} $color='primary' as={Verified} />}
          </div>
        </div>
      </ClickableContainer>

      {isExpanded ? (
        <>
          <div className="mx-5 cursor-pointer">
            <Icons.Close onClick={() => setIsExpanded(!isExpanded)}/>
          </div>
          <br/>
          <OldRow $center>
            <UserSearch 
              callbackText="Add User"
              callback={(user) => dispatch(messageActions.addUserToConversation(user.username))}
            />
            <Space />
            <ClickableSpan onClick={() => dispatch(messageActions.removeUserFromConversation(id))}>Leave</ClickableSpan>
          </OldRow>
          
        </>
      ) : (
        <div className="mx-8 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>Details</div>
      )}

      {isExpanded && (
        <div className="ml-14">
          <div className="ml-2 mr-4 sm:mx-0">
            <Description>{description}</Description>
          </div>
        </div>
      )}
    </Container>
  );
};
export default DMHeader;
