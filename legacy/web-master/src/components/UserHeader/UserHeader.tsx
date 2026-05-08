// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

import React from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import Avatar from 'components/Avatar';
import { AvatarTypes } from 'components/Avatar/Avatar';
import SmartContent from 'components/SmartContent';
import { ReactComponent as Verified } from 'graphics/commonicons/verified.svg';
import useRouting from 'hooks/useRouting';
import { OnlinePresence } from 'shared/types/documents';
import { RootState } from 'store/store';
import { User } from 'store/userSlice';
import { Col, FlexSpaceBetween, Row } from 'styles/Flex';
import { Space } from 'styles/layout';

import { Container, DisplayName, Username, VerificationIcon } from './styled';

type AvatarHeaderProps = {
  title?: string;
  subtitle?: string;
  verified?: boolean;
  withDescription?: boolean;
  description?: string;

  /** Direct image URL */
  image?: string;
  size?: number;

  type: AvatarTypes;
  onClick?: () => void;
  onHover?: () => void;
  /** If type is user, this will be hidden */
  online?: OnlinePresence;
};

export const AvatarHeader: React.FC<AvatarHeaderProps> = ({
  title,
  subtitle,
  withDescription,
  description,
  verified,
  image,
  onClick,
  onHover,
  online,
  type,
  size = 40,
}) => (
  <Container onClick={onClick} onMouseOver={onHover}>
    <FlexSpaceBetween centerY>
      <Avatar
        type={type}
        online={online}
        size={size}
        circle={type === AvatarTypes.User}
        image={image}
      />
      <Space />
      <Col $full>
        <DisplayName>{title}</DisplayName>
        <SmartContent clickable={false}>
          <Row style={{ alignItems: 'end' }}>
            {subtitle && <Username>{subtitle}</Username>}
            {verified &&
              <VerificationIcon  $solid={true} $color='primary' as={Verified} />
            }
          </Row>
          {withDescription && <h5>{description}</h5>}
        </SmartContent>

      </Col>
    </FlexSpaceBetween>
  </Container>
);

type Props = {
  user: User;
  clickOverride?: (user: User) => void
  withDescription?: boolean;
};

const UserHeader: React.FC<Props> = ({
  user,
  withDescription,
  clickOverride,
}) => {
  const history = useRouting();
  const uid = useSelector((state: RootState) => state.user.id);
  const { onlineStatus } = useSelector((state: RootState) => state.users);

  let trimUsername = user.username;
  if (trimUsername && trimUsername.length > 13) {
    trimUsername = `${trimUsername.slice(0, 13)}...`;
  }
  let trimDisplayName = user.display_name || user.username;
  if (trimDisplayName && trimDisplayName.length > 18) {
    trimDisplayName = `${trimDisplayName.slice(0, 18)}...`;
  }

  return (
    <AvatarHeader
      type={AvatarTypes.User}
      image={user.avatar}
      online={onlineStatus.get(user.id) || (uid === user.id ? OnlinePresence.Online : user.online)}
      subtitle={`@${trimUsername}`}
      title={trimDisplayName}
      withDescription={withDescription}
      description={user.description}
      verified={user?.verified}
      size={withDescription ? 50 : 40}
      onClick={() => {
        if (user.username && user.username.length > 0) {
          if (clickOverride) {
            clickOverride(user);
          } else {
            history.navigateToProfile(user.username);
          }
        } else {
          toast.warn('Sorry there was an error routing to this user.');
        }
      }}
    />
  );
};

export default UserHeader;
